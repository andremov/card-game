import { GameEngine } from './engine/GameEngine';
import { GameRenderer } from './renderer/GameRenderer';
import { SimpleAI } from './engine/AI';
import { GamePhase } from './engine/types';

export class Game {
  private engine: GameEngine;
  private renderer: GameRenderer;
  private ai: SimpleAI;
  private isProcessingAI: boolean = false;

  constructor() {
    this.engine = new GameEngine();
    this.renderer = new GameRenderer();
    this.ai = new SimpleAI();
  }

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    await this.renderer.initialize(canvas);

    this.setupEventHandlers();

    this.engine.subscribe(state => {
      this.renderer.render(state);

      if (state.phase === GamePhase.Playing && !this.isProcessingAI) {
        this.processAITurns();
      }
    });

    this.renderer.render(this.engine.getState());
  }

  private setupEventHandlers(): void {
    this.renderer.setDrawDeckHandler(() => {
      const state = this.engine.getState();
      const currentPlayer = this.engine.getCurrentPlayer();

      if (!currentPlayer.isAI && this.engine.canDrawFromDeck()) {
        this.engine.drawFromDeck();
      }
    });

    this.renderer.setTakeDiscardHandler(() => {
      const state = this.engine.getState();
      const currentPlayer = this.engine.getCurrentPlayer();

      if (!currentPlayer.isAI && this.engine.canTakeDiscardPile()) {
        this.engine.takeDiscardPile();
      }
    });

    this.renderer.setCreateMeldHandler(() => {
      const state = this.engine.getState();
      const currentPlayer = this.engine.getCurrentPlayer();

      if (!currentPlayer.isAI) {
        const selectedCards = this.renderer.getSelectedCards();
        if (selectedCards.length >= 3) {
          if (this.engine.createMeld(selectedCards)) {
            this.renderer.clearSelection();
          }
        }
      }
    });

    this.renderer.setDiscardHandler(() => {
      const state = this.engine.getState();
      const currentPlayer = this.engine.getCurrentPlayer();

      if (!currentPlayer.isAI && state.hasDrawnThisTurn) {
        const selectedCards = this.renderer.getSelectedCards();
        if (selectedCards.length === 1) {
          if (this.engine.discard(selectedCards[0])) {
            this.renderer.clearSelection();
          }
        }
      }
    });
  }

  private async processAITurns(): Promise<void> {
    if (this.isProcessingAI) return;

    const state = this.engine.getState();
    const currentPlayer = this.engine.getCurrentPlayer();

    if (currentPlayer.isAI && state.phase === GamePhase.Playing) {
      this.isProcessingAI = true;

      await this.delay(1000);

      const action = this.ai.selectAction(currentPlayer, state);

      switch (action.action) {
        case 'draw':
          this.engine.drawFromDeck();
          await this.delay(500);
          this.isProcessingAI = false;
          this.processAITurns();
          break;

        case 'meld':
          if (action.cards) {
            const cardIds = action.cards.map(c => c.id);
            this.engine.createMeld(cardIds);
            await this.delay(500);
          }
          this.isProcessingAI = false;
          this.processAITurns();
          break;

        case 'extend':
          if (action.cards && action.meldId) {
            const cardIds = action.cards.map(c => c.id);
            this.engine.extendMeld(action.meldId, cardIds);
            await this.delay(500);
          }
          this.isProcessingAI = false;
          this.processAITurns();
          break;

        case 'discard':
          if (action.discardCard) {
            this.engine.discard(action.discardCard.id);
            await this.delay(500);
          }
          this.isProcessingAI = false;
          break;
      }
    } else {
      this.isProcessingAI = false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy(): void {
    this.renderer.destroy();
  }
}
