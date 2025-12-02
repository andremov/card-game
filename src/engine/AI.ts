import { Player, Card, GameState, Meld } from './types';
import { canFormMeld, isWildcard } from './Card';

export class SimpleAI {
  selectAction(player: Player, gameState: GameState): {
    action: 'draw' | 'meld' | 'extend' | 'discard';
    cards?: Card[];
    meldId?: string;
    discardCard?: Card;
  } {
    if (!gameState.hasDrawnThisTurn) {
      return { action: 'draw' };
    }

    const meldOpportunity = this.findMeldOpportunity(player.hand);
    if (meldOpportunity) {
      return {
        action: 'meld',
        cards: meldOpportunity
      };
    }

    const extendOpportunity = this.findExtendOpportunity(player.hand, player.melds);
    if (extendOpportunity) {
      return {
        action: 'extend',
        cards: [extendOpportunity.card],
        meldId: extendOpportunity.meldId,
      };
    }

    const cardToDiscard = this.selectCardToDiscard(player.hand);
    return {
      action: 'discard',
      discardCard: cardToDiscard
    };
  }

  private findMeldOpportunity(hand: Card[]): Card[] | null {
    const cardsByRank = new Map<string, Card[]>();

    for (const card of hand) {
      if (!isWildcard(card)) {
        const rank = card.rank;
        if (!cardsByRank.has(rank)) {
          cardsByRank.set(rank, []);
        }
        cardsByRank.get(rank)!.push(card);
      }
    }

    for (const [_, cards] of cardsByRank) {
      if (cards.length >= 3) {
        const wildcards = hand.filter(c => isWildcard(c));
        const meldCards = cards.slice(0, Math.min(cards.length, 7));

        if (wildcards.length > 0 && meldCards.length < 7) {
          const wildcardsToAdd = Math.min(wildcards.length, 7 - meldCards.length);
          meldCards.push(...wildcards.slice(0, wildcardsToAdd));
        }

        const result = canFormMeld(meldCards);
        if (result.valid) {
          return meldCards;
        }
      }
    }

    return null;
  }

  private findExtendOpportunity(hand: Card[], melds: Meld[]): { card: Card; meldId: string } | null {
    for (const meld of melds) {
      for (const card of hand) {
        if (card.rank === meld.rank || isWildcard(card)) {
          const naturalCardsInMeld = meld.cards.filter(c => !isWildcard(c)).length;
          const wildcardsInMeld = meld.cards.filter(c => isWildcard(c)).length;

          if (isWildcard(card) && wildcardsInMeld >= naturalCardsInMeld) {
            continue;
          }

          return { card, meldId: meld.id };
        }
      }
    }
    return null;
  }

  private selectCardToDiscard(hand: Card[]): Card {
    const nonWildcards = hand.filter(c => !isWildcard(c));

    if (nonWildcards.length > 0) {
      const cardsByRank = new Map<string, Card[]>();

      for (const card of nonWildcards) {
        const rank = card.rank;
        if (!cardsByRank.has(rank)) {
          cardsByRank.set(rank, []);
        }
        cardsByRank.get(rank)!.push(card);
      }

      let minCount = Infinity;
      let cardToDiscard = nonWildcards[0];

      for (const [_, cards] of cardsByRank) {
        if (cards.length < minCount) {
          minCount = cards.length;
          cardToDiscard = cards[0];
        }
      }

      return cardToDiscard;
    }

    return hand[0];
  }
}
