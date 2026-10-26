import Phaser from 'phaser';
import type { HiddenId } from '../../types/world';

const COLORS = {
  cream: 0xf5ebdd,
  amber: 0xf2c879,
  lavender: 0x9c91c8,
  rose: 0xd9a4b3,
  brass: 0xd8b26f,
  brassDark: 0x9a7439,
  jam: 0x6b3d5d,
  chalk: 0xe8e2dc,
  ink: 0x2b3150,
  sage: 0x9caf98,
  shadow: 0x090d1a,
};

export class HiddenObject {
  readonly container: Phaser.GameObjects.Container;
  readonly id: HiddenId;

  private readonly scene: Phaser.Scene;
  private readonly size: number;
  private readonly onFind: (id: HiddenId) => void;
  private readonly reducedMotion: boolean;
  private readonly hoverGlow: Phaser.GameObjects.Graphics;
  private readonly glints: Phaser.GameObjects.Arc[] = [];
  private readonly zone: Phaser.GameObjects.Zone;
  private found = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: number,
    id: HiddenId,
    onFind: (id: HiddenId) => void,
    reducedMotion: boolean,
  ) {
    this.scene = scene;
    this.size = size;
    this.id = id;
    this.onFind = onFind;
    this.reducedMotion = reducedMotion;
    this.container = scene.add.container(x, y);

    const shadow = scene.add.graphics();
    shadow.fillStyle(COLORS.shadow, 0.28);
    shadow.fillEllipse(0, size * 0.18, size * 1.3, size * 0.3);
    this.container.add(shadow);

    this.hoverGlow = scene.add.graphics();
    this.hoverGlow.lineStyle(1.2, COLORS.amber, 0.55);
    this.hoverGlow.strokeCircle(0, 0, size * 0.75);
    this.hoverGlow.fillStyle(COLORS.amber, 0.06);
    this.hoverGlow.fillCircle(0, 0, size * 0.75);
    this.hoverGlow.setAlpha(0);
    this.container.add(this.hoverGlow);

    this.draw(size);
    this.addGlints(size);

    this.zone = scene.add
      .zone(0, 0, size * 1.9, size * 1.9)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.zone.on('pointerover', () => {
      if (this.found) return;
      this.scene.tweens.add({ targets: this.hoverGlow, alpha: 1, duration: 220 });
    });
    this.zone.on('pointerout', () => {
      this.scene.tweens.add({ targets: this.hoverGlow, alpha: 0, duration: 260 });
    });
    this.zone.on('pointerdown', () => this.discover());
    this.container.add(this.zone);
  }

  get isFound(): boolean {
    return this.found;
  }

  discover(): void {
    if (this.found) return;
    this.found = true;
    this.zone.disableInteractive();
    this.onFind(this.id);
    this.playDiscovery();
  }

  markFound(animate: boolean): void {
    if (this.found) return;
    this.found = true;
    this.zone.disableInteractive();
    if (animate) this.playDiscovery();
    else this.container.setVisible(false);
  }

  private playDiscovery(): void {
    if (this.reducedMotion) {
      this.container.setVisible(false);
      return;
    }

    const s = this.size;
    const ring = this.scene.add.graphics();
    ring.lineStyle(1.5, COLORS.amber, 0.85);
    ring.strokeCircle(0, 0, s * 0.5);
    this.container.add(ring);
    this.scene.tweens.add({
      targets: ring,
      scale: 2.4,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });

    for (let i = 0; i < 10; i += 1) {
      const angle = (i / 10) * Math.PI * 2;
      const mote = this.scene.add.circle(0, 0, 1.8, i % 2 === 0 ? COLORS.amber : COLORS.cream, 0.95);
      this.container.add(mote);
      const distance = s * (0.5 + Math.random() * 1.1);
      this.scene.tweens.add({
        targets: mote,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - s * 0.25,
        alpha: 0,
        duration: 750 + Math.random() * 450,
        ease: 'Sine.easeOut',
        onComplete: () => mote.destroy(),
      });
    }

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      y: this.container.y - s * 0.35,
      duration: 760,
      delay: 260,
      ease: 'Sine.easeIn',
    });
  }

  private addGlints(size: number): void {
    if (this.reducedMotion) return;
    const positions: Array<[number, number]> = [
      [-size * 0.34, -size * 0.28],
      [size * 0.4, size * 0.14],
    ];
    positions.forEach(([x, y], index) => {
      const glint = this.scene.add.circle(x, y, Math.max(1.1, size * 0.045), COLORS.cream, 0);
      this.container.add(glint);
      this.glints.push(glint);
      this.scene.tweens.add({
        targets: glint,
        alpha: { from: 0, to: 0.8 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        delay: 1400 + index * 2600,
        hold: 450,
        ease: 'Sine.easeInOut',
      });
    });
  }

  private draw(size: number): void {
    const graphics = this.scene.add.graphics();
    switch (this.id) {
      case 'paper-boat': {
        graphics.fillStyle(COLORS.cream, 0.95);
        graphics.beginPath();
        graphics.moveTo(-size * 0.55, -size * 0.05);
        graphics.lineTo(0, size * 0.16);
        graphics.lineTo(size * 0.55, -size * 0.05);
        graphics.lineTo(0, -size * 0.38);
        graphics.closePath();
        graphics.fillPath();
        graphics.lineStyle(Math.max(1, size * 0.035), 0xb9b0ad, 0.8);
        graphics.beginPath();
        graphics.moveTo(-size * 0.55, -size * 0.05);
        graphics.lineTo(0, -size * 0.05);
        graphics.lineTo(0, size * 0.16);
        graphics.moveTo(0, -size * 0.05);
        graphics.lineTo(0, -size * 0.38);
        graphics.strokePath();
        break;
      }
      case 'brass-key': {
        graphics.fillStyle(COLORS.brass, 1);
        graphics.fillCircle(-size * 0.32, -size * 0.18, size * 0.24);
        graphics.fillStyle(COLORS.brassDark, 1);
        graphics.fillCircle(-size * 0.32, -size * 0.18, size * 0.1);
        graphics.fillStyle(COLORS.brass, 1);
        graphics.fillRect(-size * 0.16, -size * 0.23, size * 0.6, size * 0.09);
        graphics.fillRect(size * 0.28, -size * 0.23, size * 0.08, size * 0.22);
        graphics.fillRect(size * 0.13, -size * 0.23, size * 0.06, size * 0.16);
        break;
      }
      case 'moon-feather': {
        graphics.fillStyle(COLORS.cream, 0.9);
        graphics.beginPath();
        graphics.moveTo(-size * 0.46, size * 0.3);
        graphics.lineTo(size * 0.05, -size * 0.48);
        graphics.lineTo(size * 0.33, -size * 0.18);
        graphics.lineTo(-size * 0.3, size * 0.4);
        graphics.closePath();
        graphics.fillPath();
        graphics.lineStyle(Math.max(1, size * 0.03), COLORS.lavender, 0.75);
        graphics.beginPath();
        graphics.moveTo(-size * 0.46, size * 0.3);
        graphics.lineTo(size * 0.05, -size * 0.48);
        graphics.strokePath();
        for (let i = 0; i < 4; i += 1) {
          const t = 0.2 + i * 0.16;
          graphics.beginPath();
          graphics.moveTo(-size * 0.5 + t * size * 0.8, size * 0.28 - t * size * 0.76);
          graphics.lineTo(-size * 0.5 + t * size * 0.8 + size * 0.13, size * 0.12 - t * size * 0.76);
          graphics.strokePath();
        }
        break;
      }
      case 'jam-jar': {
        graphics.fillStyle(COLORS.jam, 1);
        graphics.fillRoundedRect(-size * 0.32, -size * 0.22, size * 0.64, size * 0.55, size * 0.09);
        graphics.fillStyle(COLORS.cream, 0.35);
        graphics.fillRoundedRect(-size * 0.27, -size * 0.17, size * 0.16, size * 0.42, size * 0.06);
        graphics.fillStyle(COLORS.rose, 0.85);
        graphics.fillRoundedRect(-size * 0.36, -size * 0.34, size * 0.72, size * 0.18, size * 0.06);
        graphics.fillStyle(COLORS.cream, 0.5);
        graphics.fillRect(-size * 0.33, -size * 0.25, size * 0.66, size * 0.03);
        break;
      }
      case 'chalk-star': {
        graphics.lineStyle(Math.max(1.4, size * 0.045), COLORS.chalk, 0.62);
        const points: Array<[number, number]> = [];
        for (let i = 0; i < 5; i += 1) {
          const outer = -Math.PI / 2 + (i / 5) * Math.PI * 2;
          const inner = outer + Math.PI / 5;
          points.push([Math.cos(outer) * size * 0.56, Math.sin(outer) * size * 0.56]);
          points.push([Math.cos(inner) * size * 0.24, Math.sin(inner) * size * 0.24]);
        }
        graphics.beginPath();
        points.forEach(([x, y], index) => {
          if (index === 0) graphics.moveTo(x, y);
          else graphics.lineTo(x, y);
        });
        graphics.closePath();
        graphics.strokePath();
        graphics.lineStyle(Math.max(0.8, size * 0.02), COLORS.chalk, 0.3);
        graphics.strokeCircle(0, 0, size * 0.7);
        break;
      }
    }
    this.container.add(graphics);
  }
}
