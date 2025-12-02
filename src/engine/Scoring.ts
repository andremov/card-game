import { Player, Meld, MeldType } from './types';
import { getCardValue } from './Card';

export function calculateMeldScore(meld: Meld): number {
  let score = 0;

  for (const card of meld.cards) {
    score += getCardValue(card);
  }

  if (meld.cards.length >= 7) {
    score += meld.type === MeldType.Clean ? 500 : 300;
  }

  return score;
}

export function calculatePlayerScore(player: Player): number {
  let score = 0;

  for (const meld of player.melds) {
    score += calculateMeldScore(meld);
  }

  for (const card of player.hand) {
    score -= getCardValue(card);
  }

  return score;
}

export function calculateTeamScore(players: Player[], teamId: number): number {
  const teamPlayers = players.filter(p => p.teamId === teamId);
  return teamPlayers.reduce((sum, player) => sum + calculatePlayerScore(player), 0);
}
