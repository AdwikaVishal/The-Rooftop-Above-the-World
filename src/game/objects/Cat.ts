import Phaser from 'phaser';
import { CAT_REACTION_BY_ID } from '../../data/catReactions';
import type { CatReactionId } from '../../types/world';

const COLORS = {
  fur: 0xd6ae86,
  furLight: 0xe7c9a8,
  furDark: 0xb9865f,
  stripe: 0xa97853,
  rose: 0xd9a4b3,
  face: 0x5c4636,
  cream: 0xf5ebdd,
  amber: 0xf2c879,
  shadow: 0x090d1a,
};

interface Point {
  x: number;
  y: number;
}

function curvePoints(start: Point, control: Point, end: Point, steps = 20): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const inverse = 1 - t;
    points.push({
      x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
      y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y,
    });
  }
  return points;
}

function shuffle<T>(values: readonly T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = result[i];
    const b = result[j];
    if (a !== undefined && b !== undefined) {
      result[i] = b;
      result[j] = a;
    }
  }
  return result;
}

export class Cat {
  readonly container: Phaser.GameObjects.Container;

  private readonly scene: Phaser.Scene;
  private readonly unit: number;
  private readonly onPet: (reaction: CatReactionId) => void;
  private readonly reducedMotion: boolean;
  private readonly visual: Phaser.GameObjects.Container;
  private readonly bodyContainer: Phaser.GameObjects.Container;
  private readonly headContainer: Phaser.GameObjects.Container;
  private readonly leftEar: Phaser.GameObjects.Container;
  private readonly rightEar: Phaser.GameObjects.Container;
  private readonly tailContainer: Phaser.GameObjects.Container;
  private readonly openEyes: Phaser.GameObjects.Container;
  private readonly yawnMouth: Phaser.GameObjects.Graphics;
  private readonly hoverGlow: Phaser.GameObjects.Graphics;
  private readonly chaseFirefly: () => boolean;
  private readonly investigate: () => number | null;
  private bubble: Phaser.GameObjects.Container | null = null;
  private reactionBag: CatReactionId[] = [];
  private lastReaction: CatReactionId | null = null;
  private lastReactionAt = -1000;
  private activityVersion = 0;
  private breathingTween: Phaser.Tweens.Tween | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: number,
    onPet: (reaction: CatReactionId) => void,
    reducedMotion: boolean,
    chaseFirefly: () => boolean,
    investigate: () => number | null,
  ) {
    this.scene = scene;
    this.unit = size;
    this.onPet = onPet;
    this.reducedMotion = reducedMotion;
    this.chaseFirefly = chaseFirefly;
    this.investigate = investigate;

    this.container = scene.add.container(x, y);
    this.visual = scene.add.container(0, 0);
    this.container.add(this.visual);

    this.hoverGlow = scene.add.graphics();
    this.hoverGlow.lineStyle(1.4, COLORS.amber, 0.38);
    this.hoverGlow.strokeEllipse(0, size * 0.06, size * 1.95, size * 1.25);
    this.hoverGlow.setAlpha(0);
    this.visual.add(this.hoverGlow);

    this.drawShadow();
    this.tailContainer = scene.add.container(0, 0);
    this.drawTail();
    this.visual.add(this.tailContainer);

    this.bodyContainer = scene.add.container(0, 0);
    this.drawBody();
    this.visual.add(this.bodyContainer);

    this.headContainer = scene.add.container(size * 0.48, -size * 0.08);
    this.drawHead();
    this.leftEar = this.createEar(-1);
    this.rightEar = this.createEar(1);
    this.headContainer.add([this.leftEar, this.rightEar]);
    this.visual.add(this.headContainer);

    this.openEyes = this.createOpenEyes();
    this.headContainer.add(this.openEyes);

    this.yawnMouth = scene.add.graphics();
    this.drawYawnMouth();
    this.headContainer.add(this.yawnMouth);

    const zone = scene.add
      .zone(0, -size * 0.06, size * 2.35, size * 1.72)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerover', this.onPointerOver, this);
    zone.on('pointerout', this.onPointerOut, this);
    zone.on('pointerdown', this.pet, this);
    this.container.add(zone);

    this.startBreathing();
    if (!reducedMotion) {
      this.scheduleSleepyMumble();
      this.scheduleIdleBehavior();
    }
  }

  get x(): number {
    return this.container.x;
  }

  get y(): number {
    return this.container.y;
  }

  pet(): void {
    const now = this.scene.time.now;
    if (now - this.lastReactionAt < 480) return;
    this.lastReactionAt = now;
    this.activityVersion += 1;

    const reaction = this.nextReaction();
    this.onPet(reaction);
    this.performReaction(reaction);
    this.scheduleReturnToSleep(this.activityVersion);
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  private nextReaction(): CatReactionId {
    if (this.reactionBag.length === 0) {
      const all: CatReactionId[] = ['purr', 'slow-blink', 'stretch', 'yawn', 'tail-curl'];
      this.reactionBag = shuffle(all);
      if (this.lastReaction && this.reactionBag[0] === this.lastReaction) {
        const swapIndex = 1 + Math.floor(Math.random() * (this.reactionBag.length - 1));
        const first = this.reactionBag[0];
        const swap = this.reactionBag[swapIndex];
        if (first && swap) {
          this.reactionBag[0] = swap;
          this.reactionBag[swapIndex] = first;
        }
      }
    }
    const reaction = this.reactionBag.shift() ?? 'purr';
    this.lastReaction = reaction;
    return reaction;
  }

  private performReaction(reaction: CatReactionId): void {
    const u = this.unit;
    this.resetPose();
    const info = CAT_REACTION_BY_ID.get(reaction);
    this.showBubble(info?.bubble ?? 'mrrp');
    if (this.reducedMotion) return;

    switch (reaction) {
      case 'purr': {
        this.spawnHearts(4);
        if (!this.reducedMotion) {
          this.scene.tweens.add({
            targets: this.bodyContainer,
            scaleX: 1.03,
            scaleY: 0.97,
            duration: 180,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut',
            onComplete: () => this.startBreathing(),
          });
          this.scene.tweens.add({
            targets: this.headContainer,
            y: this.headContainer.y - u * 0.02,
            duration: 220,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut',
          });
        }
        break;
      }
      case 'slow-blink': {
        this.openEyes.setVisible(true).setAlpha(0);
        this.scene.tweens.add({
          targets: this.openEyes,
          alpha: 1,
          duration: 380,
          hold: 650,
          yoyo: true,
          ease: 'Sine.easeInOut',
          onComplete: () => this.openEyes.setVisible(false),
        });
        if (!this.reducedMotion) {
          this.scene.tweens.add({
            targets: this.headContainer,
            angle: this.headContainer.angle + 5,
            duration: 900,
            yoyo: true,
            ease: 'Sine.easeInOut',
          });
        }
        break;
      }
      case 'stretch': {
        if (!this.reducedMotion) {
          this.scene.tweens.add({
            targets: this.visual,
            scaleX: 1.1,
            scaleY: 0.91,
            angle: -3.5,
            duration: 520,
            yoyo: true,
            hold: 260,
            ease: 'Sine.easeInOut',
          });
          this.scene.tweens.add({
            targets: this.tailContainer,
            angle: -8,
            duration: 620,
            yoyo: true,
            ease: 'Sine.easeInOut',
          });
        }
        break;
      }
      case 'yawn': {
        this.yawnMouth.setAlpha(1);
        this.scene.tweens.add({
          targets: this.yawnMouth,
          alpha: 0,
          duration: 1100,
          delay: 420,
          ease: 'Sine.easeIn',
        });
        if (!this.reducedMotion) {
          this.scene.tweens.add({
            targets: this.headContainer,
            angle: -8,
            y: this.headContainer.y - u * 0.02,
            duration: 500,
            yoyo: true,
            hold: 360,
            ease: 'Sine.easeInOut',
          });
        }
        break;
      }
      case 'tail-curl': {
        if (!this.reducedMotion) {
          this.scene.tweens.add({
            targets: this.tailContainer,
            angle: -14,
            duration: 520,
            yoyo: true,
            hold: 480,
            ease: 'Sine.easeInOut',
          });
          this.scene.tweens.add({
            targets: this.headContainer,
            y: this.headContainer.y + u * 0.03,
            duration: 420,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut',
          });
        }
        break;
      }
    }
  }

  private resetPose(): void {
    this.breathingTween?.stop();
    this.breathingTween = null;
    this.scene.tweens.killTweensOf(this.visual);
    this.scene.tweens.killTweensOf(this.bodyContainer);
    this.scene.tweens.killTweensOf(this.headContainer);
    this.scene.tweens.killTweensOf(this.tailContainer);
    this.scene.tweens.killTweensOf(this.openEyes);
    this.scene.tweens.killTweensOf(this.yawnMouth);
    this.visual.setScale(1).setAngle(0);
    this.bodyContainer.setScale(1);
    this.headContainer.setAngle(-2);
    this.headContainer.y = -this.unit * 0.08;
    this.tailContainer.setAngle(0);
    this.leftEar.setAngle(0);
    this.rightEar.setAngle(0);
    this.openEyes.setVisible(false).setAlpha(0);
    this.yawnMouth.setAlpha(0);
  }

  private startBreathing(): void {
    if (this.reducedMotion) return;
    if (!this.breathingTween) {
      this.breathingTween = this.scene.tweens.add({
        targets: this.bodyContainer,
        scaleY: 1.022,
        duration: this.reducedMotion ? 4200 : 2500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if (this.breathingTween.isPaused()) {
      this.breathingTween.resume();
    }
  }

  private scheduleSleepyMumble(): void {
    const delay = 30000 + Math.random() * 22000;
    this.scene.time.delayedCall(delay, () => {
      if (!this.scene.sys.isActive() || !this.container.active || this.reducedMotion) return;
      if (!this.bubble) this.spawnZzz();
      this.scheduleSleepyMumble();
    });
  }

  private scheduleIdleBehavior(): void {
    const delay = 24000 + Math.random() * 24000;
    this.scene.time.delayedCall(delay, () => {
      if (!this.scene.sys.isActive() || !this.container.active || this.reducedMotion) return;
      if (this.scene.time.now - this.lastReactionAt > 7000 && !this.bubble) {
        this.performIdleBehavior();
      }
      this.scheduleIdleBehavior();
    });
  }

  private scheduleReturnToSleep(activityVersion: number): void {
    this.scene.time.delayedCall(5200 + Math.random() * 1700, () => {
      if (!this.container.active || activityVersion !== this.activityVersion) return;
      this.openEyes.setVisible(false);
      this.scene.tweens.add({
        targets: [this.headContainer, this.tailContainer, this.visual],
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        duration: this.reducedMotion ? 0 : 650,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.headContainer.setAngle(-2);
          this.startBreathing();
        },
      });
      if (!this.bubble && !this.reducedMotion) this.spawnZzz();
    });
  }

  private performIdleBehavior(): void {
    const choice = Math.random();
    if (choice < 0.08 && this.chaseFirefly()) {
      this.scene.tweens.add({
        targets: this.visual,
        scaleX: 1.08,
        scaleY: 0.93,
        angle: -3,
        duration: 420,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
      return;
    }
    if (choice < 0.2) {
      const angle = this.investigate();
      if (angle !== null) {
        this.scene.tweens.add({
          targets: this.headContainer,
          angle: this.headContainer.angle + angle,
          duration: 420,
          yoyo: true,
          hold: 850,
          ease: 'Sine.easeInOut',
        });
        return;
      }
    }

    if (choice < 0.4) {
      this.twitchEars();
    } else if (choice < 0.62) {
      this.scene.tweens.add({
        targets: this.tailContainer,
        angle: -12,
        duration: 650,
        yoyo: true,
        repeat: 1,
        ease: 'Sine.easeInOut',
      });
    } else if (choice < 0.82) {
      this.openEyes.setVisible(true).setAlpha(0);
      this.scene.tweens.add({
        targets: this.openEyes,
        alpha: 1,
        duration: 220,
        hold: 220,
        yoyo: true,
        onComplete: () => this.openEyes.setVisible(false),
      });
    } else {
      this.scene.tweens.add({
        targets: this.visual,
        scaleX: 1.045,
        scaleY: 0.96,
        duration: 460,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private twitchEars(): void {
    this.scene.tweens.add({
      targets: this.leftEar,
      angle: -7,
      duration: 160,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
    this.scene.tweens.add({
      targets: this.rightEar,
      angle: 5,
      duration: 190,
      delay: 70,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  private spawnZzz(): void {
    if (this.reducedMotion) return;
    const u = this.unit;
    const text = this.scene.add
      .text(u * 0.6, -u * 0.82, 'z', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: `${Math.max(13, u * 0.24)}px`,
        color: '#f5ebdd',
      })
      .setAlpha(0);
    this.container.add(text);
    this.scene.tweens.add({
      targets: text,
      alpha: { from: 0, to: 0.55 },
      y: -u * 1.18,
      duration: 2100,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: text,
          alpha: 0,
          duration: 600,
          onComplete: () => text.destroy(),
        });
      },
    });
  }

  private showBubble(message: string): void {
    if (this.bubble) {
      this.bubble.destroy(true);
      this.bubble = null;
    }

    const u = this.unit;
    const fontSize = Math.max(12, Math.round(u * 0.2));
    const text = this.scene.add
      .text(0, 0, message, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: `${fontSize}px`,
        color: '#2a3150',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);
    const bubbleWidth = Math.max(u * 0.9, text.width + u * 0.32);
    const bubbleHeight = Math.max(u * 0.32, text.height + u * 0.2);
    const bubble = this.scene.add.container(0, -u * 1.22);
    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.cream, 0.94);
    bg.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, bubbleHeight / 2);
    bg.fillTriangle(-u * 0.04, bubbleHeight / 2 - 1, u * 0.12, bubbleHeight / 2 - 1, 0, bubbleHeight / 2 + u * 0.1);
    bubble.add([bg, text]);

    this.container.add(bubble);
    this.bubble = bubble;
    bubble.setAlpha(0);

    if (this.reducedMotion) {
      bubble.setAlpha(1);
      this.scene.time.delayedCall(1800, () => {
        if (this.bubble === bubble) {
          bubble.destroy(true);
          this.bubble = null;
        }
      });
      return;
    }

    this.scene.tweens.add({
      targets: bubble,
      alpha: 1,
      y: -u * 1.36,
      duration: 220,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(1550, () => {
          if (!bubble.active) return;
          this.scene.tweens.add({
            targets: bubble,
            alpha: 0,
            y: bubble.y - u * 0.08,
            duration: 360,
            ease: 'Sine.easeIn',
            onComplete: () => {
              if (this.bubble === bubble) this.bubble = null;
              bubble.destroy(true);
            },
          });
        });
      },
    });
  }

  private spawnHearts(count: number): void {
    if (this.reducedMotion) return;
    const u = this.unit;
    for (let i = 0; i < count; i += 1) {
      const heart = this.scene.add
        .text(
          (Math.random() - 0.5) * u * 1.1,
          -u * (0.35 + Math.random() * 0.25),
          '♥',
          {
            fontFamily: 'Georgia, serif',
            fontSize: `${Math.max(10, u * (0.14 + Math.random() * 0.07))}px`,
            color: i % 2 === 0 ? '#d9a4b3' : '#f2c879',
          },
        )
        .setOrigin(0.5)
        .setAlpha(0);
      this.container.add(heart);
      this.scene.tweens.add({
        targets: heart,
        alpha: { from: 0, to: 0.9 },
        y: heart.y - u * (0.35 + Math.random() * 0.3),
        x: heart.x + (Math.random() - 0.5) * u * 0.35,
        duration: 900 + Math.random() * 500,
        delay: i * 90,
        ease: 'Sine.easeOut',
        onComplete: () => {
          this.scene.tweens.add({
            targets: heart,
            alpha: 0,
            duration: 450,
            onComplete: () => heart.destroy(),
          });
        },
      });
    }
  }

  private onPointerOver(): void {
    this.scene.tweens.add({ targets: this.hoverGlow, alpha: 1, duration: 220 });
  }

  private onPointerOut(): void {
    this.scene.tweens.add({ targets: this.hoverGlow, alpha: 0, duration: 260 });
  }

  private drawShadow(): void {
    const u = this.unit;
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(COLORS.shadow, 0.42);
    shadow.fillEllipse(0, u * 0.38, u * 2.15, u * 0.5);
    shadow.fillStyle(COLORS.shadow, 0.22);
    shadow.fillEllipse(0, u * 0.42, u * 2.5, u * 0.62);
    this.visual.add(shadow);
  }

  private drawTail(): void {
    const u = this.unit;
    const graphics = this.scene.add.graphics();
    const points = curvePoints(
      { x: -u * 0.62, y: u * 0.08 },
      { x: -u * 0.96, y: u * 0.6 },
      { x: u * 0.1, y: u * 0.62 },
    );
    points.push(...curvePoints(
      { x: u * 0.1, y: u * 0.62 },
      { x: u * 0.6, y: u * 0.62 },
      { x: u * 0.84, y: u * 0.28 },
      14,
    ));
    points.forEach((point, index) => {
      const progress = index / Math.max(1, points.length - 1);
      const radius = u * (0.115 - progress * 0.03);
      graphics.fillStyle(progress > 0.9 ? COLORS.furLight : COLORS.furDark, 1);
      graphics.fillCircle(point.x, point.y, Math.max(2, radius));
    });
    graphics.fillStyle(COLORS.fur, 1);
    graphics.fillCircle(points[points.length - 1]?.x ?? 0, points[points.length - 1]?.y ?? 0, u * 0.075);
    this.tailContainer.add(graphics);
  }

  private drawBody(): void {
    const u = this.unit;
    const graphics = this.scene.add.graphics();

    graphics.fillStyle(COLORS.furDark, 0.35);
    graphics.fillEllipse(-u * 0.06, u * 0.12, u * 1.44, u * 0.88);
    graphics.fillStyle(COLORS.fur, 1);
    graphics.fillEllipse(0, 0, u * 1.42, u * 0.94);
    graphics.fillStyle(COLORS.furLight, 0.9);
    graphics.fillEllipse(u * 0.16, u * 0.16, u * 0.9, u * 0.54);
    graphics.fillStyle(COLORS.furDark, 0.22);
    graphics.fillEllipse(-u * 0.38, u * 0.1, u * 0.56, u * 0.64);

    const stripeGroups: Array<[Point, Point, Point]> = [
      [
        { x: -u * 0.44, y: -u * 0.25 },
        { x: -u * 0.22, y: -u * 0.38 },
        { x: -u * 0.04, y: -u * 0.3 },
      ],
      [
        { x: -u * 0.22, y: -u * 0.02 },
        { x: -u * 0.02, y: -u * 0.16 },
        { x: u * 0.18, y: -u * 0.06 },
      ],
      [
        { x: -u * 0.36, y: u * 0.2 },
        { x: -u * 0.14, y: u * 0.06 },
        { x: u * 0.06, y: u * 0.16 },
      ],
    ];
    for (const [start, control, end] of stripeGroups) {
      const points = curvePoints(start, control, end, 14);
      graphics.lineStyle(Math.max(1.6, u * 0.035), COLORS.stripe, 0.42);
      graphics.beginPath();
      points.forEach((point, index) => {
        if (index === 0) graphics.moveTo(point.x, point.y);
        else graphics.lineTo(point.x, point.y);
      });
      graphics.strokePath();
    }

    graphics.fillStyle(COLORS.furLight, 1);
    graphics.fillEllipse(u * 0.3, u * 0.29, u * 0.32, u * 0.19);
    graphics.fillEllipse(-u * 0.1, u * 0.33, u * 0.3, u * 0.17);
    graphics.lineStyle(Math.max(1, u * 0.012), COLORS.furDark, 0.4);
    graphics.strokeEllipse(u * 0.3, u * 0.31, u * 0.1, u * 0.04);
    graphics.strokeEllipse(-u * 0.1, u * 0.35, u * 0.09, u * 0.04);

    this.bodyContainer.add(graphics);
  }

  private drawHead(): void {
    const u = this.unit;
    const graphics = this.scene.add.graphics();

    graphics.fillStyle(COLORS.furDark, 0.35);
    graphics.fillCircle(0, u * 0.06, u * 0.44);
    graphics.fillStyle(COLORS.furLight, 1);
    graphics.fillEllipse(0, 0, u * 0.88, u * 0.8);
    graphics.fillStyle(COLORS.fur, 0.75);
    graphics.fillEllipse(-u * 0.16, -u * 0.1, u * 0.5, u * 0.34);
    graphics.fillStyle(COLORS.cream, 0.55);
    graphics.fillEllipse(0, u * 0.16, u * 0.42, u * 0.24);

    this.drawFace(graphics);
    this.headContainer.add(graphics);
  }

  private createEar(side: -1 | 1): Phaser.GameObjects.Container {
    const u = this.unit;
    const ear = this.scene.add.container(side * u * 0.28, -u * 0.39);
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(COLORS.fur, 1);
    graphics.fillTriangle(-u * 0.16, u * 0.14, -u * 0.13, -u * 0.29, u * 0.15, u * 0.13);
    graphics.fillStyle(COLORS.rose, 0.58);
    graphics.fillTriangle(-u * 0.1, u * 0.07, -u * 0.08, -u * 0.18, u * 0.08, u * 0.07);
    ear.add(graphics);
    return ear;
  }

  private drawFace(graphics: Phaser.GameObjects.Graphics): void {
    const u = this.unit;
    const eyeY = u * 0.02;
    graphics.lineStyle(Math.max(1.2, u * 0.022), COLORS.face, 0.88);
    const leftEye = curvePoints(
      { x: -u * 0.24, y: eyeY },
      { x: -u * 0.18, y: eyeY + u * 0.055 },
      { x: -u * 0.11, y: eyeY },
      8,
    );
    const rightEye = curvePoints(
      { x: u * 0.1, y: eyeY },
      { x: u * 0.16, y: eyeY + u * 0.055 },
      { x: u * 0.23, y: eyeY },
      8,
    );
    for (const points of [leftEye, rightEye]) {
      graphics.beginPath();
      points.forEach((point, index) => {
        if (index === 0) graphics.moveTo(point.x, point.y);
        else graphics.lineTo(point.x, point.y);
      });
      graphics.strokePath();
    }

    graphics.fillStyle(COLORS.rose, 0.95);
    graphics.fillTriangle(
      -u * 0.035,
      u * 0.16,
      u * 0.035,
      u * 0.16,
      0,
      u * 0.205,
    );
    graphics.lineStyle(Math.max(1, u * 0.014), COLORS.face, 0.65);
    graphics.beginPath();
    graphics.moveTo(0, u * 0.205);
    graphics.lineTo(-u * 0.06, u * 0.25);
    graphics.moveTo(0, u * 0.205);
    graphics.lineTo(u * 0.06, u * 0.25);
    graphics.strokePath();

    graphics.lineStyle(Math.max(0.8, u * 0.009), COLORS.cream, 0.62);
    const whiskerSets: Array<[number, number, number, number]> = [
      [-u * 0.08, u * 0.18, -u * 0.52, u * 0.12],
      [-u * 0.08, u * 0.21, -u * 0.55, u * 0.22],
      [-u * 0.06, u * 0.24, -u * 0.48, u * 0.32],
      [u * 0.08, u * 0.18, u * 0.52, u * 0.12],
      [u * 0.08, u * 0.21, u * 0.55, u * 0.22],
      [u * 0.06, u * 0.24, u * 0.48, u * 0.32],
    ];
    for (const [x1, y1, x2, y2] of whiskerSets) {
      graphics.beginPath();
      graphics.moveTo(x1, y1);
      graphics.lineTo(x2, y2);
      graphics.strokePath();
    }
  }

  private createOpenEyes(): Phaser.GameObjects.Container {
    const u = this.unit;
    const container = this.scene.add.container(0, 0).setVisible(false);
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(COLORS.face, 0.95);
    graphics.fillEllipse(-u * 0.18, u * 0.02, u * 0.12, u * 0.15);
    graphics.fillEllipse(u * 0.16, u * 0.02, u * 0.12, u * 0.15);
    graphics.fillStyle(COLORS.cream, 0.95);
    graphics.fillCircle(-u * 0.155, -u * 0.005, u * 0.022);
    graphics.fillCircle(u * 0.185, -u * 0.005, u * 0.022);
    container.add(graphics);
    return container;
  }

  private drawYawnMouth(): void {
    const u = this.unit;
    this.yawnMouth.clear();
    this.yawnMouth.fillStyle(0x3d2f2a, 0.95);
    this.yawnMouth.fillEllipse(0, u * 0.22, u * 0.18, u * 0.15);
    this.yawnMouth.fillStyle(COLORS.rose, 1);
    this.yawnMouth.fillEllipse(0, u * 0.27, u * 0.11, u * 0.06);
    this.yawnMouth.setAlpha(0);
  }
}
