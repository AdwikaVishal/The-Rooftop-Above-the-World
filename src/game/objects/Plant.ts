import Phaser from 'phaser';
import type { PlantId } from '../../types/world';

export type PlantStyle = 'fern' | 'lavender' | 'ivy' | 'night-bloom';

const COLORS = {
  pot: 0x8e5f58,
  potLight: 0xac766b,
  potDark: 0x6f4844,
  soil: 0x2a2230,
  sage: 0x9caf98,
  sageDark: 0x6f8a76,
  lavender: 0x9c91c8,
  lavenderLight: 0xc3b9e8,
  cream: 0xf5ebdd,
  amber: 0xf2c879,
  rose: 0xd9a4b3,
  shadow: 0x090d1a,
};

interface Mote {
  x: number;
  y: number;
  color: number;
  delay: number;
}

function seededRandom(seed: number): () => number {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export class Plant {
  readonly container: Phaser.GameObjects.Container;

  private readonly scene: Phaser.Scene;
  private readonly size: number;
  private readonly style: PlantStyle;
  private readonly touchId: PlantId;
  private readonly onTouch: (plant: PlantId) => void;
  private readonly reducedMotion: boolean;
  private readonly foliage: Phaser.GameObjects.Container;
  private readonly hoverGlow: Phaser.GameObjects.Graphics;
  private readonly motes: Mote[];
  private lastTouch = -1000;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: number,
    style: PlantStyle,
    touchId: PlantId,
    onTouch: (plant: PlantId) => void,
    reducedMotion: boolean,
    seed = 7,
  ) {
    this.scene = scene;
    this.size = size;
    this.style = style;
    this.touchId = touchId;
    this.onTouch = onTouch;
    this.reducedMotion = reducedMotion;
    this.container = scene.add.container(x, y);

    const random = seededRandom(seed);
    const colors = this.moteColors();
    this.motes = Array.from({ length: 9 }, () => ({
      x: (random() - 0.5) * size * 1.5,
      y: -size * (0.55 + random() * 1.1),
      color: colors[Math.floor(random() * colors.length)] ?? COLORS.amber,
      delay: random() * 700,
    }));

    const shadow = scene.add.graphics();
    shadow.fillStyle(COLORS.shadow, 0.34);
    shadow.fillEllipse(0, 0, size * 1.35, size * 0.32);
    this.container.add(shadow);

    this.hoverGlow = scene.add.graphics();
    this.hoverGlow.lineStyle(1.3, COLORS.amber, 0.36);
    this.hoverGlow.strokeEllipse(0, -size * 0.55, size * 1.5, size * 1.5);
    this.hoverGlow.setAlpha(0);
    this.container.add(this.hoverGlow);

    this.drawPot();
    this.foliage = scene.add.container(0, -size * 0.34);
    this.drawFoliage(random);
    this.container.add(this.foliage);

    const zone = scene.add
      .zone(0, -size * 0.6, size * 1.65, size * 1.65)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      this.scene.tweens.add({ targets: this.hoverGlow, alpha: 1, duration: 220 });
    });
    zone.on('pointerout', () => {
      this.scene.tweens.add({ targets: this.hoverGlow, alpha: 0, duration: 260 });
    });
    zone.on('pointerdown', () => this.touch());
    this.container.add(zone);

    if (!reducedMotion) {
      const drift = style === 'lavender' ? 1.8 : 1.25;
      this.scene.tweens.add({
        targets: this.foliage,
        angle: drift,
        duration: 3600 + random() * 2600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: random() * 1500,
      });
    }
  }

  touch(): void {
    const now = this.scene.time.now;
    if (now - this.lastTouch < 380) return;
    this.lastTouch = now;
    this.onTouch(this.touchId);
    this.releaseMotes();
    if (!this.reducedMotion) {
      this.scene.tweens.add({
        targets: this.foliage,
        scaleX: 1.035,
        scaleY: 1.045,
        duration: 200,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private moteColors(): number[] {
    switch (this.style) {
      case 'lavender':
        return [COLORS.lavenderLight, COLORS.lavender, COLORS.cream];
      case 'ivy':
        return [COLORS.sage, COLORS.amber, COLORS.cream];
      case 'night-bloom':
        return [COLORS.cream, COLORS.amber, COLORS.lavenderLight];
      default:
        return [COLORS.sage, COLORS.amber, COLORS.cream];
    }
  }

  private releaseMotes(): void {
    for (const mote of this.motes) {
      const particle = this.scene.add.circle(0, -this.size * 0.1, 1.6, mote.color, 0.9);
      this.container.add(particle);
      if (this.reducedMotion) {
        particle.destroy();
        continue;
      }
      this.scene.tweens.add({
        targets: particle,
        x: mote.x,
        y: mote.y,
        alpha: { from: 0.9, to: 0 },
        scale: { from: 1, to: 0.25 },
        duration: 1200 + Math.random() * 800,
        delay: mote.delay,
        ease: 'Sine.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
    if (this.reducedMotion) this.hoverGlow.setAlpha(0);
    else {
      this.scene.tweens.add({
        targets: this.hoverGlow,
        alpha: { from: 0.8, to: 0 },
        duration: 900,
        ease: 'Sine.easeOut',
      });
    }
  }

  private drawPot(): void {
    const s = this.size;
    const graphics = this.scene.add.graphics();
    const potWidth = s * 0.82;
    const potHeight = s * 0.4;
    const top = -potHeight;
    const bottomInset = potWidth * 0.12;

    graphics.fillStyle(COLORS.potDark, 0.9);
    graphics.beginPath();
    graphics.moveTo(-potWidth * 0.5, top);
    graphics.lineTo(potWidth * 0.5, top);
    graphics.lineTo(potWidth * 0.5 - bottomInset, 0);
    graphics.lineTo(-potWidth * 0.5 + bottomInset, 0);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(COLORS.pot, 1);
    graphics.beginPath();
    graphics.moveTo(-potWidth * 0.47, top + s * 0.02);
    graphics.lineTo(potWidth * 0.47, top + s * 0.02);
    graphics.lineTo(potWidth * 0.4, -s * 0.02);
    graphics.lineTo(-potWidth * 0.4, -s * 0.02);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(COLORS.potDark, 0.22);
    graphics.fillEllipse(s * 0.09, -potHeight * 0.45, potWidth * 0.22, potHeight * 0.65);

    graphics.fillStyle(COLORS.potLight, 1);
    graphics.fillRoundedRect(-potWidth * 0.55, top - s * 0.055, potWidth * 1.1, s * 0.09, s * 0.025);
    graphics.fillStyle(COLORS.soil, 1);
    graphics.fillEllipse(0, top - s * 0.005, potWidth * 0.94, s * 0.1);
    graphics.fillStyle(COLORS.sageDark, 0.5);
    graphics.fillEllipse(-s * 0.1, top - s * 0.012, s * 0.2, s * 0.028);

    this.container.add(graphics);
  }

  private drawFoliage(random: () => number): void {
    const s = this.size;
    const graphics = this.scene.add.graphics();

    if (this.style === 'fern') {
      this.drawFern(graphics, random);
    } else if (this.style === 'lavender') {
      this.drawLavender(graphics, random);
    } else if (this.style === 'ivy') {
      this.drawIvy(graphics, random);
    } else {
      this.drawNightBloom(graphics, random);
    }

    const glow = this.scene.add.graphics();
    if (this.style === 'night-bloom') {
      glow.fillStyle(COLORS.cream, 0.045);
      glow.fillCircle(0, -s * 0.42, s * 0.48);
      glow.fillStyle(COLORS.amber, 0.035);
      glow.fillCircle(0, -s * 0.42, s * 0.33);
      this.foliage.add(glow);
    }
    this.foliage.add(graphics);
  }

  private drawFern(graphics: Phaser.GameObjects.Graphics, random: () => number): void {
    const s = this.size;
    const frondCount = 9;
    for (let i = 0; i < frondCount; i += 1) {
      const angle = Phaser.Math.DegToRad(-142 + (i / (frondCount - 1)) * 104);
      const length = s * (0.56 + random() * 0.25);
      const bend = (random() - 0.5) * 0.35;
      const baseX = (i - frondCount / 2) * s * 0.035;
      const baseY = 0;
      const tipX = baseX + Math.cos(angle) * length;
      const tipY = baseY + Math.sin(angle) * length;

      graphics.lineStyle(Math.max(1.1, s * 0.017), COLORS.sageDark, 0.8);
      graphics.beginPath();
      graphics.moveTo(baseX, baseY);
      const midX = baseX + Math.cos(angle + bend) * length * 0.55;
      const midY = baseY + Math.sin(angle + bend) * length * 0.55;
      graphics.lineTo(midX, midY);
      graphics.lineTo(tipX, tipY);
      graphics.strokePath();

      for (let leaf = 1; leaf <= 5; leaf += 1) {
        const t = leaf / 6;
        const x = baseX + (tipX - baseX) * t + Math.cos(angle + bend) * Math.sin(t * Math.PI) * s * 0.04;
        const y = baseY + (tipY - baseY) * t;
        const leafSize = s * (0.075 - t * 0.035);
        const side = leaf % 2 === 0 ? 1 : -1;
        const leafAngle = angle + side * Math.PI * 0.55;
        const lx = x + Math.cos(leafAngle) * leafSize * 0.8;
        const ly = y + Math.sin(leafAngle) * leafSize * 0.8;
        graphics.fillStyle(leaf % 3 === 0 ? COLORS.sage : COLORS.sageDark, 0.9);
        graphics.fillEllipse(lx, ly, leafSize * 1.9, leafSize * 0.85);
      }
    }
  }

  private drawLavender(graphics: Phaser.GameObjects.Graphics, random: () => number): void {
    const s = this.size;
    const stems = 7;
    for (let i = 0; i < stems; i += 1) {
      const angle = Phaser.Math.DegToRad(-103 + (i / (stems - 1)) * 26);
      const length = s * (0.58 + random() * 0.18);
      const baseX = (i - stems / 2) * s * 0.04;
      const tipX = baseX + Math.cos(angle) * length;
      const tipY = Math.sin(angle) * length;
      graphics.lineStyle(Math.max(1, s * 0.012), COLORS.sage, 0.9);
      graphics.beginPath();
      graphics.moveTo(baseX, 0);
      graphics.lineTo(tipX, tipY);
      graphics.strokePath();

      graphics.fillStyle(COLORS.sage, 0.85);
      graphics.fillEllipse(baseX + (tipX - baseX) * 0.4, tipY * 0.4, s * 0.09, s * 0.025);
      graphics.fillEllipse(baseX + (tipX - baseX) * 0.66, tipY * 0.66, s * 0.08, s * 0.022);

      for (let bloom = 0; bloom < 4; bloom += 1) {
        const t = 0.72 + bloom * 0.075;
        graphics.fillStyle(bloom % 2 === 0 ? COLORS.lavender : COLORS.lavenderLight, 0.95);
        graphics.fillCircle(
          baseX + (tipX - baseX) * t + (random() - 0.5) * s * 0.03,
          tipY * t + (random() - 0.5) * s * 0.025,
          s * (0.026 + random() * 0.016),
        );
      }
    }
  }

  private drawIvy(graphics: Phaser.GameObjects.Graphics, random: () => number): void {
    const s = this.size;
    for (let vine = 0; vine < 5; vine += 1) {
      const side = vine % 2 === 0 ? -1 : 1;
      const startX = side * s * (0.18 + vine * 0.045);
      const length = s * (0.55 + random() * 0.58);
      const points: Array<{ x: number; y: number }> = [];
      for (let step = 0; step <= 8; step += 1) {
        const t = step / 8;
        points.push({
          x: startX + Math.sin(t * Math.PI * 1.3 + vine) * s * 0.12 * side,
          y: -s * 0.02 + t * length,
        });
      }
      graphics.lineStyle(Math.max(1, s * 0.013), COLORS.sageDark, 0.75);
      graphics.beginPath();
      points.forEach((point, index) => {
        if (index === 0) graphics.moveTo(point.x, point.y);
        else graphics.lineTo(point.x, point.y);
      });
      graphics.strokePath();

      for (let leaf = 1; leaf < points.length; leaf += 1) {
        const point = points[leaf];
        if (!point) continue;
        const leafSize = s * (0.065 + random() * 0.03);
        graphics.fillStyle(leaf % 2 === 0 ? COLORS.sage : COLORS.sageDark, 0.92);
        graphics.fillEllipse(
          point.x + (leaf % 2 === 0 ? -1 : 1) * leafSize * 0.4,
          point.y,
          leafSize * 1.7,
          leafSize * 0.9,
        );
      }
    }

    for (let i = 0; i < 5; i += 1) {
      const angle = Phaser.Math.DegToRad(-130 + i * 22);
      const length = s * (0.4 + random() * 0.24);
      graphics.lineStyle(Math.max(1, s * 0.012), COLORS.sageDark, 0.7);
      graphics.beginPath();
      graphics.moveTo(0, 0);
      graphics.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
      graphics.strokePath();
      graphics.fillStyle(COLORS.sage, 0.85);
      graphics.fillEllipse(
        Math.cos(angle) * length,
        Math.sin(angle) * length,
        s * 0.08,
        s * 0.05,
      );
    }
  }

  private drawNightBloom(graphics: Phaser.GameObjects.Graphics, random: () => number): void {
    const s = this.size;
    const stems = 5;
    for (let i = 0; i < stems; i += 1) {
      const angle = Phaser.Math.DegToRad(-115 + i * 13);
      const length = s * (0.5 + random() * 0.2);
      const tipX = Math.cos(angle) * length;
      const tipY = Math.sin(angle) * length;
      graphics.lineStyle(Math.max(1.2, s * 0.014), COLORS.sageDark, 0.85);
      graphics.beginPath();
      graphics.moveTo(0, 0);
      graphics.lineTo(tipX, tipY);
      graphics.strokePath();

      if (i % 2 === 0) {
        graphics.fillStyle(COLORS.sage, 0.9);
        graphics.fillEllipse(tipX * 0.45, tipY * 0.45, s * 0.13, s * 0.055);
      }

      if (i === 2) {
        graphics.fillStyle(COLORS.lavenderLight, 0.35);
        graphics.fillCircle(tipX, tipY, s * 0.14);
      }
      const petalCount = 5;
      for (let petal = 0; petal < petalCount; petal += 1) {
        const petalAngle = (petal / petalCount) * Math.PI * 2 + i * 0.4;
        const petalRadius = s * 0.048;
        graphics.fillStyle(COLORS.cream, 0.95);
        graphics.fillEllipse(
          tipX + Math.cos(petalAngle) * s * 0.055,
          tipY + Math.sin(petalAngle) * s * 0.055,
          petalRadius * 1.8,
          petalRadius,
        );
      }
      graphics.fillStyle(COLORS.amber, 1);
      graphics.fillCircle(tipX, tipY, s * 0.025);
    }
  }
}
