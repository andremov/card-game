import { Graphics, Container, Text } from 'pixi.js';
import { Card, Suit, Rank } from '../engine/types';

export class CardSprite extends Container {
  private card: Card;
  private bg: Graphics;
  private isSelected: boolean = false;

  constructor(card: Card, width: number = 60, height: number = 84) {
    super();
    this.card = card;

    this.bg = new Graphics();
    this.drawCard(width, height);
    this.addChild(this.bg);

    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  private drawCard(width: number, height: number): void {
    this.bg.clear();

    this.bg.roundRect(0, 0, width, height, 5);
    this.bg.fill(0xffffff);
    this.bg.stroke({ width: 2, color: this.isSelected ? 0x4a90e2 : 0x333333 });

    const color = this.getSuitColor();
    const rankText = new Text({
      text: this.card.rank,
      style: {
        fontSize: 16,
        fill: color,
        fontWeight: 'bold',
      },
    });
    rankText.x = 5;
    rankText.y = 5;
    this.addChild(rankText);

    if (this.card.suit) {
      const suitSymbol = this.getSuitSymbol();
      const suitText = new Text({
        text: suitSymbol,
        style: {
          fontSize: 24,
          fill: color,
        },
      });
      suitText.anchor.set(0.5);
      suitText.x = width / 2;
      suitText.y = height / 2;
      this.addChild(suitText);
    } else {
      const jokerText = new Text({
        text: '🃏',
        style: {
          fontSize: 24,
        },
      });
      jokerText.anchor.set(0.5);
      jokerText.x = width / 2;
      jokerText.y = height / 2;
      this.addChild(jokerText);
    }
  }

  private getSuitColor(): number {
    if (!this.card.suit) return 0x000000;
    return this.card.suit === Suit.Hearts || this.card.suit === Suit.Diamonds ? 0xcc0000 : 0x000000;
  }

  private getSuitSymbol(): string {
    switch (this.card.suit) {
      case Suit.Hearts: return '♥';
      case Suit.Diamonds: return '♦';
      case Suit.Clubs: return '♣';
      case Suit.Spades: return '♠';
      default: return '';
    }
  }

  setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.drawCard(60, 84);
  }

  getCard(): Card {
    return this.card;
  }
}
