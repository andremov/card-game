import { Card, Rank, Suit } from './types';

export function createCard(rank: Rank, suit: Suit | null, deckIndex: number, cardIndex: number): Card {
  const isJoker = rank === Rank.Joker;
  return {
    id: `${deckIndex}-${suit || 'joker'}-${rank}-${cardIndex}`,
    rank,
    suit,
    isJoker,
  };
}

export function isWildcard(card: Card): boolean {
  return card.isJoker || card.rank === Rank.Two;
}

export function getCardValue(card: Card): number {
  if (card.isJoker) return 50;
  if (card.rank === Rank.Two) return 20;
  if (card.rank === Rank.Ace) return 15;
  if ([Rank.King, Rank.Queen, Rank.Jack].includes(card.rank)) return 10;
  return 5;
}

export function canFormMeld(cards: Card[]): { valid: boolean; rank: Rank | null; type: 'clean' | 'dirty' | null } {
  if (cards.length < 3) return { valid: false, rank: null, type: null };

  const naturalCards = cards.filter(c => !isWildcard(c));
  const wildcards = cards.filter(c => isWildcard(c));

  if (naturalCards.length < 3) return { valid: false, rank: null, type: null };

  const rank = naturalCards[0].rank;
  const allSameRank = naturalCards.every(c => c.rank === rank);

  if (!allSameRank) return { valid: false, rank: null, type: null };

  if (wildcards.length > naturalCards.length) return { valid: false, rank: null, type: null };

  return {
    valid: true,
    rank,
    type: wildcards.length > 0 ? 'dirty' : 'clean',
  };
}
