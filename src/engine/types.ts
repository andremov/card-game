export enum Suit {
  Hearts = 'hearts',
  Diamonds = 'diamonds',
  Clubs = 'clubs',
  Spades = 'spades',
}

export enum Rank {
  Ace = 'A',
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Joker = 'JOKER',
}

export interface Card {
  id: string;
  rank: Rank;
  suit: Suit | null;
  isJoker: boolean;
}

export enum MeldType {
  Clean = 'clean',
  Dirty = 'dirty',
}

export interface Meld {
  id: string;
  cards: Card[];
  type: MeldType;
  rank: Rank;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  melds: Meld[];
  isAI: boolean;
  teamId: number;
}

export enum GamePhase {
  Dealing = 'dealing',
  Playing = 'playing',
  Finished = 'finished',
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  deck: Card[];
  discardPile: Card[];
  buyPile1: Card[];
  buyPile2: Card[];
  scores: { team1: number; team2: number };
  hasDrawnThisTurn: boolean;
  canTakeDiscardPile: boolean;
}

export interface GameAction {
  type: 'draw' | 'discard' | 'meld' | 'extend_meld' | 'take_discard_pile' | 'end_turn';
  playerId: string;
  cardIds?: string[];
  meldId?: string;
  targetRank?: Rank;
}
