import { Application, Container, Graphics, Text } from 'pixi.js';
import { GameState, Card, Player, Meld } from '../engine/types';
import { CardSprite } from './CardSprite';

export class GameRenderer {
  private app: Application;
  private gameContainer: Container;
  private playerHandContainer: Container;
  private opponentsContainer: Container;
  private tableContainer: Container;
  private selectedCards: Set<string> = new Set();
  private cardSprites: Map<string, CardSprite> = new Map();

  private onCardClick?: (card: Card) => void;
  private onDrawDeck?: () => void;
  private onTakeDiscard?: () => void;
  private onCreateMeld?: () => void;
  private onDiscard?: () => void;

  constructor() {
    this.app = new Application();
    this.gameContainer = new Container();
    this.playerHandContainer = new Container();
    this.opponentsContainer = new Container();
    this.tableContainer = new Container();
  }

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    await this.app.init({
      canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x0a5f38,
    });

    this.app.stage.addChild(this.gameContainer);
    this.gameContainer.addChild(this.tableContainer);
    this.gameContainer.addChild(this.opponentsContainer);
    this.gameContainer.addChild(this.playerHandContainer);

    this.createTableElements();
  }

  private createTableElements(): void {
    const deckX = 100;
    const deckY = this.app.screen.height / 2 - 50;

    const deckBg = new Graphics();
    deckBg.roundRect(0, 0, 60, 84, 5);
    deckBg.fill(0x2c5f2d);
    deckBg.stroke({ width: 2, color: 0x97c99d });
    deckBg.x = deckX;
    deckBg.y = deckY;
    deckBg.eventMode = 'static';
    deckBg.cursor = 'pointer';
    deckBg.on('pointerdown', () => this.onDrawDeck?.());
    this.tableContainer.addChild(deckBg);

    const deckText = new Text({
      text: 'DECK',
      style: { fontSize: 12, fill: 0xffffff },
    });
    deckText.anchor.set(0.5);
    deckText.x = deckX + 30;
    deckText.y = deckY - 15;
    this.tableContainer.addChild(deckText);

    const discardX = deckX + 80;
    const discardBg = new Graphics();
    discardBg.roundRect(0, 0, 60, 84, 5);
    discardBg.fill(0x444444);
    discardBg.stroke({ width: 2, color: 0x666666 });
    discardBg.x = discardX;
    discardBg.y = deckY;
    discardBg.eventMode = 'static';
    discardBg.cursor = 'pointer';
    discardBg.on('pointerdown', () => this.onTakeDiscard?.());
    this.tableContainer.addChild(discardBg);

    const discardText = new Text({
      text: 'DISCARD',
      style: { fontSize: 12, fill: 0xffffff },
    });
    discardText.anchor.set(0.5);
    discardText.x = discardX + 30;
    discardText.y = deckY - 15;
    this.tableContainer.addChild(discardText);

    this.createActionButtons();
  }

  private createActionButtons(): void {
    const buttonY = this.app.screen.height - 120;
    const buttonWidth = 100;
    const buttonHeight = 35;

    const createButton = (text: string, x: number, onClick: () => void) => {
      const button = new Graphics();
      button.roundRect(0, 0, buttonWidth, buttonHeight, 5);
      button.fill(0x4a90e2);
      button.stroke({ width: 2, color: 0x357abd });
      button.x = x;
      button.y = buttonY;
      button.eventMode = 'static';
      button.cursor = 'pointer';
      button.on('pointerdown', onClick);

      const buttonText = new Text({
        text,
        style: { fontSize: 14, fill: 0xffffff, fontWeight: 'bold' },
      });
      buttonText.anchor.set(0.5);
      buttonText.x = x + buttonWidth / 2;
      buttonText.y = buttonY + buttonHeight / 2;

      this.tableContainer.addChild(button);
      this.tableContainer.addChild(buttonText);
    };

    createButton('Create Meld', this.app.screen.width / 2 - 160, () => this.onCreateMeld?.());
    createButton('Discard', this.app.screen.width / 2 - 50, () => this.onDiscard?.());
  }

  render(state: GameState): void {
    this.playerHandContainer.removeChildren();
    this.opponentsContainer.removeChildren();
    this.cardSprites.clear();

    const humanPlayer = state.players.find(p => !p.isAI);
    if (humanPlayer) {
      this.renderPlayerHand(humanPlayer);
      this.renderPlayerMelds(humanPlayer);
    }

    this.renderOpponents(state.players.filter(p => p.isAI));
    this.renderDiscardPile(state.discardPile);
    this.renderGameInfo(state);
  }

  private renderPlayerHand(player: Player): void {
    const startX = (this.app.screen.width - player.hand.length * 70) / 2;
    const y = this.app.screen.height - 100;

    player.hand.forEach((card, index) => {
      const sprite = new CardSprite(card);
      sprite.x = startX + index * 70;
      sprite.y = y;

      sprite.on('pointerdown', () => {
        if (this.selectedCards.has(card.id)) {
          this.selectedCards.delete(card.id);
          sprite.setSelected(false);
        } else {
          this.selectedCards.add(card.id);
          sprite.setSelected(true);
        }
        this.onCardClick?.(card);
      });

      this.playerHandContainer.addChild(sprite);
      this.cardSprites.set(card.id, sprite);
    });
  }

  private renderPlayerMelds(player: Player): void {
    let meldX = this.app.screen.width / 2 - 200;
    const meldY = this.app.screen.height - 250;

    player.melds.forEach(meld => {
      const meldContainer = new Container();
      meldContainer.x = meldX;
      meldContainer.y = meldY;

      meld.cards.forEach((card, index) => {
        const sprite = new CardSprite(card, 50, 70);
        sprite.x = index * 30;
        meldContainer.addChild(sprite);
      });

      this.playerHandContainer.addChild(meldContainer);
      meldX += meld.cards.length * 30 + 40;
    });
  }

  private renderOpponents(opponents: Player[]): void {
    opponents.forEach((opponent, index) => {
      const x = index === 0 ? 50 : index === 1 ? this.app.screen.width / 2 - 100 : this.app.screen.width - 250;
      const y = 50;

      const opponentText = new Text({
        text: `${opponent.name}: ${opponent.hand.length} cards`,
        style: { fontSize: 16, fill: 0xffffff },
      });
      opponentText.x = x;
      opponentText.y = y;
      this.opponentsContainer.addChild(opponentText);

      if (opponent.melds.length > 0) {
        const meldsText = new Text({
          text: `Melds: ${opponent.melds.length}`,
          style: { fontSize: 14, fill: 0xaaaaaa },
        });
        meldsText.x = x;
        meldsText.y = y + 25;
        this.opponentsContainer.addChild(meldsText);
      }
    });
  }

  private renderDiscardPile(discardPile: Card[]): void {
    if (discardPile.length === 0) return;

    const topCard = discardPile[discardPile.length - 1];
    const sprite = new CardSprite(topCard);
    sprite.x = 180;
    sprite.y = this.app.screen.height / 2 - 50;
    this.tableContainer.addChild(sprite);
  }

  private renderGameInfo(state: GameState): void {
    const infoText = new Text({
      text: `Current Turn: ${state.players[state.currentPlayerIndex].name}\nDeck: ${state.deck.length} cards\nTeam 1: ${state.scores.team1} | Team 2: ${state.scores.team2}`,
      style: { fontSize: 16, fill: 0xffffff, align: 'center' },
    });
    infoText.anchor.set(0.5, 0);
    infoText.x = this.app.screen.width / 2;
    infoText.y = 20;
    this.tableContainer.addChild(infoText);
  }

  getSelectedCards(): string[] {
    return Array.from(this.selectedCards);
  }

  clearSelection(): void {
    this.selectedCards.clear();
    this.cardSprites.forEach(sprite => sprite.setSelected(false));
  }

  setCardClickHandler(handler: (card: Card) => void): void {
    this.onCardClick = handler;
  }

  setDrawDeckHandler(handler: () => void): void {
    this.onDrawDeck = handler;
  }

  setTakeDiscardHandler(handler: () => void): void {
    this.onTakeDiscard = handler;
  }

  setCreateMeldHandler(handler: () => void): void {
    this.onCreateMeld = handler;
  }

  setDiscardHandler(handler: () => void): void {
    this.onDiscard = handler;
  }

  destroy(): void {
    this.app.destroy(true);
  }
}
