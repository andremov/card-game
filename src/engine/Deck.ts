import { Card, Rank, Suit } from './types';
import { createCard } from './Card';

export function createDeck(): Card[] {
  const cards: Card[] = [];
  const suits = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades];
  const ranks = [
    Rank.Ace, Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six,
    Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King
  ];

  for (let deckIndex = 0; deckIndex < 2; deckIndex++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        cards.push(createCard(rank, suit, deckIndex, cards.length));
      }
    }
    cards.push(createCard(Rank.Joker, null, deckIndex, cards.length));
    cards.push(createCard(Rank.Joker, null, deckIndex, cards.length));
  }

  return cards;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
