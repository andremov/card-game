import { GameState, GamePhase, Player, Card, Meld, MeldType, Rank } from './types';
import { createDeck, shuffleDeck } from './Deck';
import { canFormMeld, isWildcard } from './Card';
import { calculateTeamScore } from './Scoring';

export class GameEngine {
  private state: GameState;
  private listeners: ((state: GameState) => void)[] = [];

  constructor() {
    this.state = this.initializeGame();
  }

  private initializeGame(): GameState {
    const deck = shuffleDeck(createDeck());

    const players: Player[] = [
      { id: 'player1', name: 'You', hand: [], melds: [], isAI: false, teamId: 1 },
      { id: 'ai1', name: 'AI 1', hand: [], melds: [], isAI: true, teamId: 2 },
      { id: 'ai2', name: 'AI 2', hand: [], melds: [], isAI: true, teamId: 1 },
      { id: 'ai3', name: 'AI 3', hand: [], melds: [], isAI: true, teamId: 2 },
    ];

    let deckIndex = 0;
    for (const player of players) {
      player.hand = deck.slice(deckIndex, deckIndex + 11);
      deckIndex += 11;
    }

    const buyPile1 = deck.slice(deckIndex, deckIndex + 11);
    deckIndex += 11;
    const buyPile2 = deck.slice(deckIndex, deckIndex + 11);
    deckIndex += 11;

    const remainingDeck = deck.slice(deckIndex);

    return {
      phase: GamePhase.Playing,
      players,
      currentPlayerIndex: 0,
      deck: remainingDeck,
      discardPile: [],
      buyPile1,
      buyPile2,
      scores: { team1: 0, team2: 0 },
      hasDrawnThisTurn: false,
      canTakeDiscardPile: false,
    };
  }

  getState(): GameState {
    return this.state;
  }

  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  drawFromDeck(): boolean {
    if (this.state.hasDrawnThisTurn) return false;
    if (this.state.deck.length === 0) return false;

    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    const card = this.state.deck.pop()!;
    currentPlayer.hand.push(card);
    this.state.hasDrawnThisTurn = true;
    this.notifyListeners();
    return true;
  }

  createMeld(cardIds: string[]): boolean {
    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    const cards = cardIds.map(id => currentPlayer.hand.find(c => c.id === id)).filter(c => c) as Card[];

    if (cards.length !== cardIds.length) return false;

    const result = canFormMeld(cards);
    if (!result.valid || !result.rank) return false;

    const meld: Meld = {
      id: `meld-${Date.now()}-${Math.random()}`,
      cards,
      type: result.type === 'clean' ? MeldType.Clean : MeldType.Dirty,
      rank: result.rank,
    };

    currentPlayer.melds.push(meld);
    currentPlayer.hand = currentPlayer.hand.filter(c => !cardIds.includes(c.id));

    this.notifyListeners();
    return true;
  }

  extendMeld(meldId: string, cardIds: string[]): boolean {
    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    const meld = currentPlayer.melds.find(m => m.id === meldId);

    if (!meld) return false;

    const cards = cardIds.map(id => currentPlayer.hand.find(c => c.id === id)).filter(c => c) as Card[];
    if (cards.length !== cardIds.length) return false;

    const naturalCardsInMeld = meld.cards.filter(c => !isWildcard(c)).length;
    const wildcardsInMeld = meld.cards.filter(c => isWildcard(c)).length;

    for (const card of cards) {
      if (!isWildcard(card) && card.rank !== meld.rank) return false;

      if (isWildcard(card)) {
        if (wildcardsInMeld + 1 > naturalCardsInMeld + cards.filter(c => !isWildcard(c)).length) {
          return false;
        }
      }
    }

    meld.cards.push(...cards);
    if (cards.some(c => isWildcard(c))) {
      meld.type = MeldType.Dirty;
    }

    currentPlayer.hand = currentPlayer.hand.filter(c => !cardIds.includes(c.id));

    this.notifyListeners();
    return true;
  }

  discard(cardId: string): boolean {
    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    const cardIndex = currentPlayer.hand.findIndex(c => c.id === cardId);

    if (cardIndex === -1) return false;
    if (!this.state.hasDrawnThisTurn) return false;

    const card = currentPlayer.hand.splice(cardIndex, 1)[0];
    this.state.discardPile.push(card);

    if (currentPlayer.hand.length === 0 && currentPlayer.melds.length > 0) {
      this.endGame();
    } else {
      this.nextTurn();
    }

    this.notifyListeners();
    return true;
  }

  takeDiscardPile(): boolean {
    if (this.state.discardPile.length === 0) return false;
    if (this.state.hasDrawnThisTurn) return false;

    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    const topCard = this.state.discardPile[this.state.discardPile.length - 1];

    const hasMatchingMeld = currentPlayer.melds.some(m => m.rank === topCard.rank);
    const hasMatchingCards = currentPlayer.hand.filter(c => c.rank === topCard.rank).length >= 2;

    if (!hasMatchingMeld && !hasMatchingCards) return false;

    currentPlayer.hand.push(...this.state.discardPile);
    this.state.discardPile = [];
    this.state.hasDrawnThisTurn = true;

    this.notifyListeners();
    return true;
  }

  private nextTurn(): void {
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
    this.state.hasDrawnThisTurn = false;
  }

  private endGame(): void {
    this.state.phase = GamePhase.Finished;
    this.state.scores.team1 = calculateTeamScore(this.state.players, 1);
    this.state.scores.team2 = calculateTeamScore(this.state.players, 2);
  }

  getCurrentPlayer(): Player {
    return this.state.players[this.state.currentPlayerIndex];
  }

  canDrawFromDeck(): boolean {
    return !this.state.hasDrawnThisTurn && this.state.deck.length > 0;
  }

  canTakeDiscardPile(): boolean {
    if (this.state.discardPile.length === 0) return false;
    if (this.state.hasDrawnThisTurn) return false;

    const currentPlayer = this.getCurrentPlayer();
    const topCard = this.state.discardPile[this.state.discardPile.length - 1];

    return currentPlayer.melds.some(m => m.rank === topCard.rank) ||
           currentPlayer.hand.filter(c => c.rank === topCard.rank).length >= 2;
  }
}
