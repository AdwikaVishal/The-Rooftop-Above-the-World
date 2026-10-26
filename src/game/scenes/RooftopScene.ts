import Phaser from 'phaser';
import { DEFAULT_SELECTIONS } from '../../data/decorations';
import { gameEvents } from '../EventBus';
import { Cat } from '../objects/Cat';
import { HiddenObject } from '../objects/HiddenObject';
import { Plant, type PlantStyle } from '../objects/Plant';
import { HIDDEN_DISCOVERIES } from '../../data/hidden';
import type {
  CatReactionId,
  DecorationCategory,
  HiddenId,
  PlantId,
  SceneState,
  Selections,
} from '../../types/world';

const COLORS = {
  midnight: 0x15192f,
  deep: 0x0b0f20,
  twilight: 0x283451,
  lavender: 0x9c91c8,
  lavenderLight: 0xc3b9e8,
  cream: 0xf5ebdd,
  amber: 0xf2c879,
  amberDeep: 0xc7904b,
  rose: 0xd9a4b3,
  sage: 0x9caf98,
  sageDark: 0x6f8a76,
  roofLight: 0x2b3450,
  roof: 0x151a2d,
  roofDark: 0x0c1120,
  metal: 0x4b5375,
  metalLight: 0x6e7699,
  wood: 0x72513f,
  woodLight: 0x8f6951,
  woodDark: 0x4f382f,
  cityFar: 0x26304d,
  cityNear: 0x151b31,
  moon: 0xf6ecd6,
  moonShade: 0xcdc3cc,
};

const HIDDEN_POSITIONS: Partial<Record<HiddenId, { x: number; y: number; size: number }>> = {
  'paper-boat': { x: 0.205, y: 0.832, size: 0.022 },
  'brass-key': { x: 0.715, y: 0.892, size: 0.026 },
  'moon-feather': { x: 0.685, y: 0.572, size: 0.023 },
  'jam-jar': { x: 0.654, y: 0.887, size: 0.024 },
  'chalk-star': { x: 0.465, y: 0.905, size: 0.032 },
};

interface Bounds {
  width: number;
  height: number;
  min: number;
  roofY: number;
  railTop: number;
  isNarrow: boolean;
}

function createRandom(seed: number): () => number {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function sameSelections(a: Selections, b: Selections): boolean {
  return (Object.keys(a) as DecorationCategory[]).every((key) => a[key] === b[key]);
}

export class RooftopScene extends Phaser.Scene {
  private state: SceneState = {
    hidden: [],
    lightsOn: true,
    selections: { ...DEFAULT_SELECTIONS },
    celestial: [],
    constellations: [],
  };

  private bounds: Bounds = {
    width: 1280,
    height: 800,
    min: 800,
    roofY: 544,
    railTop: 400,
    isNarrow: false,
  };

  private built = false;
  private reducedMotion = false;
  private skyBack!: Phaser.GameObjects.Container;
  private starLayer!: Phaser.GameObjects.Container;
  private cloudLayer!: Phaser.GameObjects.Container;
  private cityLayer!: Phaser.GameObjects.Container;
  private rooftopLayer!: Phaser.GameObjects.Container;
  private lightsGlowLayer!: Phaser.GameObjects.Container;
  private foregroundLayer!: Phaser.GameObjects.Container;
  private atmosphereLayer!: Phaser.GameObjects.Container;
  private nightVeil!: Phaser.GameObjects.Rectangle;
  private cat: Cat | null = null;
  private hiddenObjects = new Map<HiddenId, HiddenObject>();
  private plants = new Map<PlantId, Plant>();
  private fireflies: Phaser.GameObjects.Container[] = [];
  private fireflyDrift = new WeakMap<Phaser.GameObjects.Container, () => void>();
  private resizeTimer: Phaser.Time.TimerEvent | null = null;
  private unsubscribeSync: (() => void) | null = null;
  private unsubscribeReducedMotion: (() => void) | null = null;
  private parallaxTarget = { x: 0, y: 0 };
  private parallaxCurrent = { x: 0, y: 0 };

  constructor() {
    super('RooftopScene');
  }

  create(): void {
    const initial = this.registry.get('rooftopSceneState') as SceneState | undefined;
    if (initial) {
      this.state = {
        hidden: [...initial.hidden],
        lightsOn: initial.lightsOn,
        selections: { ...initial.selections },
        celestial: [...initial.celestial],
        constellations: [...initial.constellations],
      };
    }

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.ensureTextures();
    this.buildWorld();

    this.unsubscribeSync = gameEvents.on('app:sync', this.handleSync);
    this.unsubscribeReducedMotion = gameEvents.on('app:reduced-motion', this.handleReducedMotion);
    this.scale.on('resize', this.handleResize, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('gameout', this.handlePointerOut, this);
    document.addEventListener('visibilitychange', this.handleVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);

    this.cameras.main.fadeIn(1100, 9, 13, 26);
    this.game.events.emit('rooftop:ready');
    gameEvents.emit('game:ready', undefined);
  }

  override update(_time: number, delta: number): void {
    const layers = [
      { layer: this.starLayer, factor: -10 },
      { layer: this.cloudLayer, factor: -26 },
      { layer: this.cityLayer, factor: -15 },
    ];
    const smoothing = Math.min(1, delta / 260);
    this.parallaxCurrent.x += (this.parallaxTarget.x - this.parallaxCurrent.x) * smoothing;
    this.parallaxCurrent.y += (this.parallaxTarget.y - this.parallaxCurrent.y) * smoothing;
    if (this.reducedMotion) {
      this.parallaxCurrent.x = 0;
      this.parallaxCurrent.y = 0;
    }
    for (const { layer, factor } of layers) {
      if (!layer || !layer.active) continue;
      layer.x = this.parallaxCurrent.x * factor;
      layer.y = this.parallaxCurrent.y * factor * 0.22;
    }
  }

  private readonly handleSync = (next: SceneState): void => {
    if (!this.sys.isActive()) return;
    const previous = this.state;
    this.state = {
      hidden: [...next.hidden],
      lightsOn: next.lightsOn,
      selections: { ...next.selections },
      celestial: [...next.celestial],
      constellations: [...next.constellations],
    };

    if (!this.built) return;

    if (
      !sameSelections(previous.selections, next.selections) ||
      previous.hidden.some((id) => !next.hidden.includes(id))
    ) {
      this.rebuild();
      return;
    }

    for (const id of next.hidden) {
      const hidden = this.hiddenObjects.get(id);
      if (hidden && !hidden.isFound) hidden.markFound(true);
    }

    if (previous.lightsOn !== next.lightsOn) {
      this.applyLights(false);
    }
  };

  private readonly handleReducedMotion = (reduced: boolean): void => {
    if (this.reducedMotion === reduced) return;
    this.reducedMotion = reduced;
    if (reduced) {
      this.parallaxTarget.x = 0;
      this.parallaxTarget.y = 0;
      this.parallaxCurrent.x = 0;
      this.parallaxCurrent.y = 0;
    }
    if (this.built) this.rebuild();
  };

  private readonly handleResize = (): void => {
    if (this.resizeTimer) {
      this.resizeTimer.remove(false);
      this.resizeTimer = null;
    }
    this.resizeTimer = this.time.delayedCall(160, () => {
      this.resizeTimer = null;
      this.rebuild();
    });
  };

  private readonly handlePointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (this.reducedMotion) return;
    const width = Math.max(1, this.scale.width);
    const height = Math.max(1, this.scale.height);
    this.parallaxTarget.x = (pointer.x / width - 0.5) * 2;
    this.parallaxTarget.y = (pointer.y / height - 0.5) * 2;
  };

  private readonly handlePointerOut = (): void => {
    this.parallaxTarget.x = 0;
    this.parallaxTarget.y = 0;
  };

  private readonly handleVisibility = (): void => {
    if (document.hidden) {
      this.tweens.pauseAll();
      this.time.paused = true;
    } else {
      this.tweens.resumeAll();
      this.time.paused = false;
    }
  };

  private readonly handleShutdown = (): void => {
    this.unsubscribeSync?.();
    this.unsubscribeSync = null;
    this.unsubscribeReducedMotion?.();
    this.unsubscribeReducedMotion = null;
    this.scale.off('resize', this.handleResize, this);
    this.input.off('pointermove', this.handlePointerMove, this);
    this.input.off('gameout', this.handlePointerOut, this);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.children.removeAll(true);
    this.hiddenObjects.clear();
    this.plants.clear();
    this.fireflies = [];
    this.fireflyDrift = new WeakMap();
    this.cat = null;
    this.built = false;
  };

  private rebuild(): void {
    this.built = false;
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.children.removeAll(true);
    this.hiddenObjects.clear();
    this.plants.clear();
    this.fireflies = [];
    this.fireflyDrift = new WeakMap();
    this.cat = null;
    this.resizeTimer = null;
    this.buildWorld();
  }

  private buildWorld(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const min = Math.min(width, height);
    const isNarrow = width < 720;
    const roofY = height * (isNarrow ? 0.7 : 0.695);
    const railHeight = Phaser.Math.Clamp(height * 0.155, 72, 168);
    const railTop = roofY - railHeight;
    this.bounds = { width, height, min, roofY, railTop, isNarrow };

    this.skyBack = this.add.container(0, 0).setDepth(0);
    this.starLayer = this.add.container(0, 0).setDepth(2);
    this.cloudLayer = this.add.container(0, 0).setDepth(4);
    this.cityLayer = this.add.container(0, 0).setDepth(6);
    this.rooftopLayer = this.add.container(0, 0).setDepth(10);
    this.lightsGlowLayer = this.add.container(0, 0).setDepth(11);
    this.foregroundLayer = this.add.container(0, 0).setDepth(14);
    this.atmosphereLayer = this.add.container(0, 0).setDepth(18);
    this.nightVeil = this.add
      .rectangle(0, roofY + 10, width, height - roofY + 10, 0x050815, 0)
      .setOrigin(0, 0)
      .setDepth(30);

    this.buildSky();
    this.buildStars();
    this.buildMoon();
    this.buildClouds();
    this.buildCity();
    this.buildRooftop();
    this.buildRug();
    this.buildTable();
    this.buildPlants();
    this.buildCat();
    this.buildTelescope();
    this.buildHiddenObjects();
    this.buildFireflies();
    this.buildAtmosphereMotes();

    this.applyLights(true);
    this.built = true;
  }

  private ensureTextures(): void {
    if (!this.textures.exists('rooftop-glow')) {
      const texture = this.textures.createCanvas('rooftop-glow', 256, 256);
      if (texture) {
        const context = texture.getContext();
        const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.22, 'rgba(255,255,255,0.62)');
        gradient.addColorStop(0.6, 'rgba(255,255,255,0.14)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 256, 256);
        texture.refresh();
      }
    }

    if (!this.textures.exists('rooftop-sky')) {
      const texture = this.textures.createCanvas('rooftop-sky', 8, 512);
      if (texture) {
        const context = texture.getContext();
        const gradient = context.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#080c1b');
        gradient.addColorStop(0.28, '#10162a');
        gradient.addColorStop(0.54, '#1a2340');
        gradient.addColorStop(0.78, '#2b3657');
        gradient.addColorStop(0.92, '#4a4f70');
        gradient.addColorStop(1, '#6d6377');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 8, 512);
        texture.refresh();
      }
    }

    if (!this.textures.exists('rooftop-floor')) {
      const texture = this.textures.createCanvas('rooftop-floor', 8, 512);
      if (texture) {
        const context = texture.getContext();
        const gradient = context.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#2a314c');
        gradient.addColorStop(0.16, '#222940');
        gradient.addColorStop(0.6, '#171d31');
        gradient.addColorStop(1, '#0e1322');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 8, 512);
        texture.refresh();
      }
    }

    if (!this.textures.exists('rooftop-cloud')) {
      const texture = this.textures.createCanvas('rooftop-cloud', 512, 220);
      if (texture) {
        const context = texture.getContext();
        context.globalCompositeOperation = 'lighter';
        const blobs: Array<[number, number, number, number]> = [
          [140, 120, 120, 54],
          [220, 92, 120, 66],
          [306, 106, 128, 60],
          [386, 132, 102, 45],
          [268, 140, 168, 54],
          [76, 146, 78, 36],
        ];
        for (const [cx, cy, rx, ry] of blobs) {
          const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, rx);
          gradient.addColorStop(0, 'rgba(255,255,255,0.35)');
          gradient.addColorStop(0.55, 'rgba(255,255,255,0.14)');
          gradient.addColorStop(1, 'rgba(255,255,255,0)');
          context.fillStyle = gradient;
          context.beginPath();
          context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          context.fill();
        }
        texture.refresh();
      }
    }
  }

  private buildSky(): void {
    const { width, height, roofY } = this.bounds;
    const sky = this.add
      .image(0, 0, 'rooftop-sky')
      .setOrigin(0)
      .setDisplaySize(width + 80, height + 80)
      .setPosition(-40, -40)
      .setAlpha(0.98);
    this.skyBack.add(sky);

    const horizonGlow = this.add
      .image(width * 0.52, roofY - height * 0.02, 'rooftop-glow')
      .setDisplaySize(width * 1.35, height * 0.48)
      .setTint(0xdaa76a)
      .setAlpha(0.16)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.skyBack.add(horizonGlow);

    const coolGlow = this.add
      .image(width * 0.28, height * 0.38, 'rooftop-glow')
      .setDisplaySize(width * 0.9, height * 0.55)
      .setTint(0x7485b4)
      .setAlpha(0.08)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.skyBack.add(coolGlow);
  }

  private buildStars(): void {
    const { width, height, roofY } = this.bounds;
    const random = createRandom(1937);
    const count = Phaser.Math.Clamp(Math.floor((width * height) / 11000), 48, 150);
    const palette = [COLORS.cream, COLORS.lavenderLight, COLORS.amber, 0xdfe6ff];
    const brightStars: Array<{ x: number; y: number; radius: number; color: number }> = [];

    for (let i = 0; i < count; i += 1) {
      const x = random() * (width + 40) - 20;
      const y = 18 + random() * Math.max(60, roofY - 60);
      const radius = 0.45 + Math.pow(random(), 2.2) * 1.55;
      const color = palette[Math.floor(random() * palette.length)] ?? COLORS.cream;
      const alpha = 0.28 + random() * 0.62;
      if (radius > 1.55) brightStars.push({ x, y, radius, color });

      if (radius > 1.2) {
        const glow = this.add
          .image(x, y, 'rooftop-glow')
          .setDisplaySize(radius * 12, radius * 12)
          .setTint(color)
          .setAlpha(alpha * 0.24)
          .setBlendMode(Phaser.BlendModes.ADD);
        this.starLayer.add(glow);
      }

      const star = this.add.circle(x, y, radius, color, alpha);
      this.starLayer.add(star);

      if (!this.reducedMotion) {
        if (!this.reducedMotion) {
          this.tweens.add({
            targets: star,
            alpha: Math.max(0.12, alpha * 0.25),
            duration: 1100 + random() * 2600,
            delay: random() * 2400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        }
      }
    }

    for (const bright of brightStars.slice(0, 7)) {
      const flare = this.add.graphics();
      flare.lineStyle(0.8, bright.color, 0.3);
      flare.beginPath();
      flare.moveTo(bright.x - 6, bright.y);
      flare.lineTo(bright.x + 6, bright.y);
      flare.moveTo(bright.x, bright.y - 6);
      flare.lineTo(bright.x, bright.y + 6);
      flare.strokePath();
      this.starLayer.add(flare);
    }

    if (!this.reducedMotion) {
      this.scheduleShootingStar(9000 + Math.random() * 5000);
    }

    const randomDust = createRandom(88);
    for (let i = 0; i < 9; i += 1) {
      const x = randomDust() * width;
      const y = height * (0.25 + randomDust() * 0.25);
      const mote = this.add.circle(x, y, 1.1, COLORS.cream, 0);
      this.starLayer.add(mote);
      if (!this.reducedMotion) {
        this.tweens.add({
          targets: mote,
          alpha: { from: 0, to: 0.4 },
          y: y - 20,
          duration: 3000,
          delay: randomDust() * 8000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }
  }

  private scheduleShootingStar(delay: number): void {
    this.time.delayedCall(delay, () => {
      if (!this.built || this.reducedMotion) return;
      const { width, height } = this.bounds;
      const startX = width * (0.15 + Math.random() * 0.6);
      const startY = height * (0.06 + Math.random() * 0.18);
      const distance = 90 + Math.random() * 120;
      const angle = Phaser.Math.DegToRad(25 + Math.random() * 18);
      const graphics = this.add.graphics();
      graphics.lineStyle(1.2, COLORS.cream, 0.9);
      graphics.beginPath();
      graphics.moveTo(startX, startY);
      graphics.lineTo(startX + Math.cos(angle) * distance, startY + Math.sin(angle) * distance);
      graphics.strokePath();
      graphics.setBlendMode(Phaser.BlendModes.ADD);
      this.starLayer.add(graphics);
      this.tweens.add({
        targets: graphics,
        alpha: 0,
        x: Math.cos(angle) * 36,
        y: Math.sin(angle) * 36,
        duration: 950,
        ease: 'Sine.easeIn',
        onComplete: () => graphics.destroy(),
      });
      this.scheduleShootingStar(16000 + Math.random() * 18000);
    });
  }

  private buildMoon(): void {
    const { width, height, min } = this.bounds;
    const radius = Phaser.Math.Clamp(min * 0.078, 24, 64);
    const x = width * (this.bounds.isNarrow ? 0.78 : 0.8);
    const y = height * (this.bounds.isNarrow ? 0.155 : 0.18);

    const container = this.add.container(x, y);
    const halo = this.add
      .image(0, 0, 'rooftop-glow')
      .setDisplaySize(radius * 8.5, radius * 8.5)
      .setTint(0xf5e5bb)
      .setAlpha(0.36)
      .setBlendMode(Phaser.BlendModes.ADD);
    container.add(halo);

    const haloRing = this.add.graphics();
    haloRing.lineStyle(1, COLORS.cream, 0.08);
    haloRing.strokeCircle(0, 0, radius * 1.72);
    haloRing.lineStyle(0.8, COLORS.cream, 0.05);
    haloRing.strokeCircle(0, 0, radius * 2.18);
    container.add(haloRing);

    const disc = this.add.graphics();
    disc.fillStyle(COLORS.moon, 1);
    disc.fillCircle(0, 0, radius);
    disc.fillStyle(COLORS.moonShade, 0.22);
    disc.fillCircle(radius * 0.18, radius * 0.12, radius * 0.87);
    const craters: Array<[number, number, number, number]> = [
      [-0.24, -0.2, 0.17, 0.15],
      [0.13, -0.32, 0.09, 0.11],
      [0.32, 0.18, 0.13, 0.12],
      [-0.1, 0.3, 0.08, 0.07],
      [-0.47, 0.15, 0.06, 0.05],
    ];
    for (const [cx, cy, rw, rh] of craters) {
      disc.fillStyle(COLORS.lavender, 0.13);
      disc.fillEllipse(cx * radius, cy * radius, rw * radius, rh * radius);
    }
    disc.fillStyle(COLORS.cream, 0.32);
    disc.fillCircle(-radius * 0.32, -radius * 0.2, radius * 0.12);
    container.add(disc);

    const glint = this.add.circle(radius * 0.55, -radius * 0.55, Math.max(1.2, radius * 0.035), COLORS.cream, 0.85);
    container.add(glint);

    const zone = this.add
      .zone(0, 0, radius * 2.5, radius * 2.5)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      this.tweens.add({ targets: halo, alpha: 0.58, duration: 280 });
      this.tweens.add({ targets: glint, scale: 1.5, duration: 280 });
    });
    zone.on('pointerout', () => {
      this.tweens.add({ targets: halo, alpha: 0.36, duration: 320 });
      this.tweens.add({ targets: glint, scale: 1, duration: 320 });
    });
    zone.on('pointerdown', () => {
      gameEvents.emit('game:moon-clicked', undefined);
      this.spawnBurst(x, y, [COLORS.cream, COLORS.lavenderLight, COLORS.amber], 14, radius * 1.2);
      this.tweens.add({
        targets: container,
        scale: 1.045,
        duration: 180,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    });
    container.add(zone);

    if (!this.reducedMotion) {
      this.tweens.add({
        targets: container,
        y: y + radius * 0.08,
        duration: 6200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.starLayer.add(container);
  }

  private buildClouds(): void {
    const { width, height, isNarrow } = this.bounds;
    const random = createRandom(445);
    const count = isNarrow ? 3 : 4;
    for (let i = 0; i < count; i += 1) {
      const cloudWidth = Phaser.Math.Clamp(width * (0.25 + random() * 0.22), 190, 640);
      const cloud = this.add
        .image(0, 0, 'rooftop-cloud')
        .setDisplaySize(cloudWidth, cloudWidth * 0.41)
        .setTint(i % 2 === 0 ? COLORS.lavender : 0x6f7ba8)
        .setAlpha(0.16 + random() * 0.1)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      const startX = random() * width - cloudWidth * 0.2;
      const y = height * (0.07 + random() * 0.24);
      cloud.setPosition(startX, y);
      this.cloudLayer.add(cloud);
      if (!this.reducedMotion) {
        const travel = width + cloudWidth * 1.4;
        this.tweens.add({
          targets: cloud,
          x: startX + travel,
          duration: 140000 + random() * 160000,
          delay: random() * 20000,
          repeat: -1,
          ease: 'Linear',
          onRepeat: () => {
            cloud.x = -cloudWidth * 1.2;
          },
        });
      }
    }
  }

  private buildCity(): void {
    const { width, height, roofY } = this.bounds;
    const random = createRandom(711);
    const horizon = roofY - 18;

    const haze = this.add
      .image(width * 0.5, horizon, 'rooftop-glow')
      .setDisplaySize(width * 1.2, height * 0.24)
      .setTint(0xf0bd77)
      .setAlpha(0.13)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.cityLayer.add(haze);

    const far = this.add.graphics();
    far.fillStyle(COLORS.cityFar, 0.72);
    let x = -60;
    const farBuildings: Array<{ x: number; y: number; w: number; h: number }> = [];
    while (x < width + 60) {
      const buildingWidth = 34 + random() * 88;
      const buildingHeight = 28 + random() * height * 0.17;
      const top = horizon - buildingHeight;
      far.fillRect(x, top, buildingWidth, buildingHeight + 30);
      farBuildings.push({ x, y: top, w: buildingWidth, h: buildingHeight });
      if (random() > 0.68) {
        far.fillTriangle(
          x + buildingWidth * 0.2,
          top,
          x + buildingWidth * 0.5,
          top - 10 - random() * 24,
          x + buildingWidth * 0.8,
          top,
        );
      }
      x += buildingWidth + 3 + random() * 12;
    }
    this.cityLayer.add(far);

    for (const building of farBuildings) {
      const columns = Math.max(1, Math.floor(building.w / 15));
      const rows = Math.max(1, Math.floor(building.h / 17));
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          if (random() > 0.3) continue;
          const wx = building.x + 7 + column * 14;
          const wy = building.y + 9 + row * 16;
          if (wy > horizon - 4) continue;
          const warm = random() > 0.25;
          const dot = this.add.circle(
            wx,
            wy,
            0.8 + random() * 0.75,
            warm ? COLORS.amber : COLORS.lavenderLight,
            0.22 + random() * 0.42,
          );
          this.cityLayer.add(dot);
        }
      }
    }

    const near = this.add.graphics();
    near.fillStyle(COLORS.cityNear, 0.92);
    x = -40;
    const nearBuildings: Array<{ x: number; y: number; w: number; h: number }> = [];
    while (x < width + 40) {
      const buildingWidth = 46 + random() * 105;
      const buildingHeight = 18 + random() * height * 0.1;
      const top = horizon + 12 - buildingHeight;
      near.fillRect(x, top, buildingWidth, buildingHeight + 34);
      nearBuildings.push({ x, y: top, w: buildingWidth, h: buildingHeight });
      if (random() > 0.7) {
        const towerX = x + buildingWidth * (0.2 + random() * 0.5);
        near.fillRect(towerX, top - 14, 18, 14);
        near.fillTriangle(towerX - 2, top - 14, towerX + 9, top - 24, towerX + 20, top - 14);
      }
      x += buildingWidth + 2 + random() * 8;
    }
    this.cityLayer.add(near);

    for (const building of nearBuildings) {
      const columns = Math.max(1, Math.floor(building.w / 17));
      const rows = Math.max(1, Math.floor(building.h / 15));
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          if (random() > 0.26) continue;
          const wx = building.x + 8 + column * 16;
          const wy = building.y + 8 + row * 14;
          if (wy > horizon + 4) continue;
          const dot = this.add.rectangle(
            wx,
            wy,
            1.4,
            1.9,
            random() > 0.35 ? COLORS.amber : 0xaeb8d8,
            0.25 + random() * 0.45,
          );
          this.cityLayer.add(dot);
        }
      }
    }

    const antennas = this.add.graphics();
    antennas.lineStyle(1, 0x646b8d, 0.55);
    for (let i = 0; i < 4; i += 1) {
      const ax = width * (0.15 + random() * 0.7);
      const ay = horizon - height * (0.08 + random() * 0.07);
      antennas.beginPath();
      antennas.moveTo(ax, ay);
      antennas.lineTo(ax, ay - 14 - random() * 22);
      antennas.strokePath();
      antennas.fillStyle(0xf2c879, 0.55);
      antennas.fillCircle(ax, ay - 18 - random() * 20, 1.2);
    }
    this.cityLayer.add(antennas);
  }

  private buildRooftop(): void {
    const { width, height, roofY, railTop } = this.bounds;
    const floor = this.add
      .image(0, roofY, 'rooftop-floor')
      .setOrigin(0)
      .setDisplaySize(width, height - roofY + 16);
    this.rooftopLayer.add(floor);

    const planks = this.add.graphics();
    for (let i = 0; i < 9; i += 1) {
      const t = Math.pow(i / 8, 1.28);
      const y = roofY + 20 + t * (height - roofY - 12);
      planks.lineStyle(1, 0xa6add0, 0.045 + t * 0.035);
      planks.beginPath();
      planks.moveTo(0, y);
      planks.lineTo(width, y);
      planks.strokePath();
      if (i > 1) {
        const seam = (i % 3 === 0 ? 0.26 : 0.61) * width + (i % 2 === 0 ? 24 : -18);
        planks.lineStyle(0.8, 0x050914, 0.12);
        planks.beginPath();
        planks.moveTo(seam, y - (height - roofY) * 0.02);
        planks.lineTo(seam, y + 3);
        planks.strokePath();
      }
    }
    this.rooftopLayer.add(planks);

    const ledge = this.add.graphics();
    ledge.fillStyle(0x303854, 1);
    ledge.fillRect(0, roofY - 16, width, 24);
    ledge.fillStyle(0x424b6b, 0.7);
    ledge.fillRect(0, roofY - 16, width, 4);
    ledge.fillStyle(0x090d1b, 0.5);
    ledge.fillRect(0, roofY + 8, width, 7);
    this.rooftopLayer.add(ledge);

    const rail = this.add.graphics();
    const margin = 24;
    const usable = width - margin * 2;
    const posts = Math.max(4, Math.round(usable / 108));
    const step = usable / (posts - 1);
    const railColor = COLORS.metal;
    const railLight = COLORS.metalLight;

    for (let i = 0; i < posts; i += 1) {
      const x = margin + i * step;
      rail.lineStyle(3, railColor, 0.95);
      rail.beginPath();
      rail.moveTo(x, roofY - 8);
      rail.lineTo(x, railTop);
      rail.strokePath();
      rail.lineStyle(1, railLight, 0.4);
      rail.beginPath();
      rail.moveTo(x - 1, roofY - 8);
      rail.lineTo(x - 1, railTop + 2);
      rail.strokePath();
    }
    rail.lineStyle(4, railColor, 0.95);
    rail.beginPath();
    rail.moveTo(margin, railTop);
    rail.lineTo(width - margin, railTop);
    rail.strokePath();
    rail.lineStyle(1.3, railLight, 0.45);
    rail.beginPath();
    rail.moveTo(margin, railTop - 1.5);
    rail.lineTo(width - margin, railTop - 1.5);
    rail.strokePath();
    rail.lineStyle(2, railColor, 0.7);
    rail.beginPath();
    rail.moveTo(margin, railTop + (roofY - railTop) * 0.58);
    rail.lineTo(width - margin, railTop + (roofY - railTop) * 0.58);
    rail.strokePath();
    this.rooftopLayer.add(rail);

    const amber = this.state.selections.lantern === 'moonlit';
    const bulbColor = amber ? 0xbfd1f1 : COLORS.amber;
    const bulbGlow = amber ? 0xbfd1f1 : 0xffc56b;

    const cable = this.add.graphics();
    cable.lineStyle(1.1, 0x12182a, 0.85);
    const bulbPositions: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < posts - 1; i += 1) {
      const x1 = margin + i * step;
      const x2 = x1 + step;
      const sag = Math.min(24, step * 0.18);
      const bulbs = Math.max(2, Math.round(step / 54));
      cable.beginPath();
      for (let s = 0; s <= 12; s += 1) {
        const t = s / 12;
        const x = Phaser.Math.Linear(x1, x2, t);
        const y = railTop + 6 + Math.sin(Math.PI * t) * sag;
        if (s === 0) cable.moveTo(x, y);
        else cable.lineTo(x, y);
      }
      cable.strokePath();
      for (let b = 0; b < bulbs; b += 1) {
        const t = (b + 0.5) / bulbs;
        bulbPositions.push({
          x: Phaser.Math.Linear(x1, x2, t),
          y: railTop + 8 + Math.sin(Math.PI * t) * sag,
        });
      }
    }
    this.rooftopLayer.add(cable);

    for (const position of bulbPositions) {
      const glow = this.add
        .image(position.x, position.y, 'rooftop-glow')
        .setDisplaySize(34, 34)
        .setTint(bulbGlow)
        .setAlpha(0.42)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.lightsGlowLayer.add(glow);
      const core = this.add.circle(position.x, position.y + 2.2, 2.2, bulbColor, 0.95);
      this.rooftopLayer.add(core);
      if (!this.reducedMotion) {
        this.tweens.add({
          targets: glow,
          alpha: 0.36,
          duration: 1500 + Math.random() * 1800,
          yoyo: true,
          repeat: -1,
          delay: Math.random() * 1200,
          ease: 'Sine.easeInOut',
        });
      }
    }

    this.buildHangingLantern(0.075, railTop, bulbColor, bulbGlow);
    this.buildHangingLantern(0.925, railTop, bulbColor, bulbGlow);

    const floorGlow = this.add
      .image(width * 0.5, roofY + (height - roofY) * 0.47, 'rooftop-glow')
      .setDisplaySize(width * 0.72, (height - roofY) * 0.9)
      .setTint(bulbGlow)
      .setAlpha(0.12)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.lightsGlowLayer.add(floorGlow);

    const sideGlowLeft = this.add
      .image(width * 0.06, roofY + (height - roofY) * 0.45, 'rooftop-glow')
      .setDisplaySize(width * 0.28, (height - roofY) * 0.7)
      .setTint(bulbGlow)
      .setAlpha(0.16)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.lightsGlowLayer.add(sideGlowLeft);
    const sideGlowRight = this.add
      .image(width * 0.94, roofY + (height - roofY) * 0.45, 'rooftop-glow')
      .setDisplaySize(width * 0.28, (height - roofY) * 0.7)
      .setTint(bulbGlow)
      .setAlpha(0.14)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.lightsGlowLayer.add(sideGlowRight);
  }

  private buildHangingLantern(
    xFraction: number,
    railTop: number,
    bulbColor: number,
    bulbGlow: number,
  ): void {
    if (this.reducedMotion) return;
    const { width, min } = this.bounds;
    const x = width * xFraction;
    const size = Phaser.Math.Clamp(min * 0.034, 13, 27);
    const cord = this.add.graphics();
    cord.lineStyle(1.2, 0x2a3148, 0.9);
    cord.beginPath();
    cord.moveTo(x, railTop + 2);
    cord.lineTo(x, railTop + size * 1.4);
    cord.strokePath();
    this.rooftopLayer.add(cord);

    const glow = this.add
      .image(x, railTop + size * 2.2, 'rooftop-glow')
      .setDisplaySize(size * 6, size * 6)
      .setTint(bulbGlow)
      .setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.lightsGlowLayer.add(glow);

    const lantern = this.add.container(x, railTop + size * 2.2);
    const body = this.add.graphics();
    body.fillStyle(0x242a42, 0.96);
    body.fillRoundedRect(-size * 0.45, -size * 0.25, size * 0.9, size * 0.8, 4);
    body.fillStyle(bulbColor, 0.88);
    body.fillRoundedRect(-size * 0.32, -size * 0.1, size * 0.64, size * 0.5, 3);
    body.lineStyle(1.4, 0x4c5475, 1);
    body.strokeRoundedRect(-size * 0.45, -size * 0.25, size * 0.9, size * 0.8, 4);
    body.fillStyle(0x3a4262, 1);
    body.fillRect(-size * 0.5, -size * 0.33, size, size * 0.1);
    body.fillStyle(0x4c5475, 1);
    body.fillRect(-size * 0.5, size * 0.52, size, size * 0.08);
    lantern.add(body);
    this.rooftopLayer.add(lantern);

    const zone = this.add
      .zone(x, railTop + size * 2.2, size * 2.4, size * 2.8)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => gameEvents.emit('game:lights-request', undefined));
    zone.on('pointerover', () => {
      this.tweens.add({ targets: glow, alpha: 0.8, duration: 200 });
    });
    zone.on('pointerout', () => {
      this.tweens.add({ targets: glow, alpha: 0.5, duration: 260 });
    });
    this.rooftopLayer.add(zone);
  }

  private buildRug(): void {
    const { width, height, min } = this.bounds;
    const rugWidth = Math.min(width * 0.4, min * 0.66);
    const rugHeight = rugWidth * 0.29;
    const x = width * (this.bounds.isNarrow ? 0.54 : 0.55);
    const y = height * 0.9;
    const starQuilt = this.state.selections.rug === 'star-quilt';

    const shadow = this.add.graphics();
    shadow.fillStyle(0x060a16, 0.34);
    shadow.fillEllipse(x, y + 8, rugWidth * 1.05, rugHeight * 1.1);
    this.foregroundLayer.add(shadow);

    const rug = this.add.graphics();
    rug.fillStyle(starQuilt ? 0x3b4569 : 0x343a5b, 0.95);
    rug.fillEllipse(x, y, rugWidth, rugHeight);
    rug.lineStyle(2, starQuilt ? COLORS.amber : COLORS.lavender, 0.45);
    rug.strokeEllipse(x, y, rugWidth * 0.9, rugHeight * 0.84);
    rug.lineStyle(1.2, COLORS.cream, 0.16);
    rug.strokeEllipse(x, y, rugWidth * 0.72, rugHeight * 0.64);

    if (starQuilt) {
      const patchColors = [0x4a5578, 0x584a6e, 0x465c62, 0x64536a];
      for (let i = 0; i < 7; i += 1) {
        const px = x + (Math.random() - 0.5) * rugWidth * 0.62;
        const py = y + (Math.random() - 0.5) * rugHeight * 0.52;
        rug.fillStyle(patchColors[i % patchColors.length] ?? 0x4a5578, 0.7);
        rug.fillEllipse(px, py, rugWidth * 0.2, rugHeight * 0.26);
      }
      for (let i = 0; i < 12; i += 1) {
        const angle = (i / 12) * Math.PI * 2;
        const px = x + Math.cos(angle) * rugWidth * (0.18 + (i % 3) * 0.09);
        const py = y + Math.sin(angle) * rugHeight * (0.18 + (i % 3) * 0.1);
        rug.fillStyle(i % 2 === 0 ? COLORS.cream : COLORS.amber, 0.6);
        rug.fillCircle(px, py, 1.3);
      }
    } else {
      rug.lineStyle(1, COLORS.rose, 0.2);
      rug.beginPath();
      rug.moveTo(x - rugWidth * 0.36, y);
      rug.lineTo(x + rugWidth * 0.36, y);
      rug.strokePath();
      rug.lineStyle(1, COLORS.sage, 0.16);
      rug.beginPath();
      rug.moveTo(x, y - rugHeight * 0.27);
      rug.lineTo(x, y + rugHeight * 0.27);
      rug.strokePath();
    }

    const fringe = this.add.graphics();
    fringe.lineStyle(1, COLORS.cream, 0.28);
    const fringeCount = 16;
    for (let i = 0; i < fringeCount; i += 1) {
      const t = i / (fringeCount - 1);
      const fx = Phaser.Math.Linear(x - rugWidth * 0.45, x + rugWidth * 0.45, t);
      const bend = Math.sin(t * Math.PI) * rugHeight * 0.5;
      fringe.beginPath();
      fringe.moveTo(fx, y + bend * 0.86);
      fringe.lineTo(fx + (t - 0.5) * 8, y + bend * 0.86 + 7);
      fringe.strokePath();
    }
    this.foregroundLayer.add(rug);
    this.foregroundLayer.add(fringe);
  }

  private buildTable(): void {
    const { width, height, min } = this.bounds;
    const x = width * (this.bounds.isNarrow ? 0.29 : 0.285);
    const y = height * 0.83;
    const size = Phaser.Math.Clamp(min * 0.105, 37, 96);
    const container = this.add.container(x, y);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x060a16, 0.36);
    shadow.fillEllipse(0, size * 0.18, size * 1.7, size * 0.38);
    container.add(shadow);

    const table = this.add.graphics();
    table.lineStyle(Math.max(2, size * 0.055), COLORS.woodDark, 1);
    table.beginPath();
    table.moveTo(-size * 0.5, -size * 0.05);
    table.lineTo(-size * 0.38, size * 0.24);
    table.moveTo(size * 0.5, -size * 0.05);
    table.lineTo(size * 0.38, size * 0.24);
    table.moveTo(0, -size * 0.04);
    table.lineTo(0, size * 0.2);
    table.strokePath();

    table.fillStyle(COLORS.wood, 1);
    table.fillEllipse(0, -size * 0.24, size * 1.45, size * 0.48);
    table.fillStyle(COLORS.woodLight, 0.8);
    table.fillEllipse(0, -size * 0.26, size * 1.3, size * 0.37);
    table.fillStyle(0x36251f, 0.45);
    table.fillEllipse(0, -size * 0.18, size * 1.28, size * 0.2);
    table.lineStyle(1, COLORS.woodLight, 0.5);
    table.strokeEllipse(0, -size * 0.24, size * 1.44, size * 0.47);
    container.add(table);

    if (this.state.selections.trinket === 'orrery') {
      this.addOrrery(container, size);
    } else {
      this.addTeacup(container, size);
    }

    const book = this.add.graphics();
    book.fillStyle(0x6e4a50, 0.95);
    book.fillRoundedRect(size * 0.46, -size * 0.22, size * 0.36, size * 0.1, 2);
    book.fillStyle(COLORS.cream, 0.55);
    book.fillRect(size * 0.5, -size * 0.19, size * 0.28, size * 0.022);
    container.add(book);

    this.foregroundLayer.add(container);
  }

  private addTeacup(container: Phaser.GameObjects.Container, size: number): void {
    const cup = this.add.graphics();
    cup.fillStyle(COLORS.cream, 0.95);
    cup.fillEllipse(0, -size * 0.42, size * 0.28, size * 0.11);
    cup.fillStyle(0xd8c9b6, 0.9);
    cup.fillRoundedRect(-size * 0.09, -size * 0.54, size * 0.18, size * 0.12, 3);
    cup.fillStyle(COLORS.cream, 1);
    cup.fillRoundedRect(-size * 0.1, -size * 0.59, size * 0.2, size * 0.12, 3);
    cup.lineStyle(1.3, 0xcbbda9, 1);
    cup.strokeCircle(size * 0.11, -size * 0.54, size * 0.045);
    cup.fillStyle(0x6e4a3b, 0.9);
    cup.fillEllipse(0, -size * 0.56, size * 0.15, size * 0.045);
    container.add(cup);

    if (this.reducedMotion) return;
    for (let i = 0; i < 2; i += 1) {
      const steam = this.add.graphics();
      steam.lineStyle(1, COLORS.cream, 0.16);
      steam.beginPath();
      const startX = (i - 0.5) * size * 0.05;
      steam.moveTo(startX, -size * 0.64);
      steam.lineTo(startX + size * 0.04, -size * 0.72);
      steam.lineTo(startX - size * 0.02, -size * 0.8);
      steam.strokePath();
      container.add(steam);
      this.tweens.add({
        targets: steam,
        alpha: { from: 0.25, to: 0 },
        y: -size * 0.08,
        duration: 2500 + i * 700,
        repeat: -1,
        delay: i * 900,
        ease: 'Sine.easeOut',
      });
    }
  }

  private addOrrery(container: Phaser.GameObjects.Container, size: number): void {
    const orrery = this.add.graphics();
    orrery.lineStyle(1.4, 0xb99152, 0.9);
    orrery.strokeEllipse(0, -size * 0.48, size * 0.3, size * 0.13);
    orrery.lineStyle(1, 0xb99152, 0.6);
    orrery.strokeEllipse(0, -size * 0.48, size * 0.18, size * 0.08);
    orrery.fillStyle(COLORS.amber, 1);
    orrery.fillCircle(0, -size * 0.48, size * 0.03);
    orrery.fillStyle(COLORS.lavenderLight, 1);
    orrery.fillCircle(size * 0.1, -size * 0.52, size * 0.018);
    orrery.fillStyle(COLORS.rose, 1);
    orrery.fillCircle(-size * 0.07, -size * 0.46, size * 0.014);
    orrery.fillStyle(0xb99152, 1);
    orrery.fillRect(-size * 0.01, -size * 0.44, size * 0.02, size * 0.08);
    container.add(orrery);
    if (!this.reducedMotion) {
      this.tweens.add({
        targets: orrery,
        angle: 360,
        duration: 60000,
        repeat: -1,
        ease: 'Linear',
      });
    }
  }

  private buildPlants(): void {
    const { width, height, min, isNarrow } = this.bounds;
    const planterStyle = this.state.selections.planter as PlantStyle;
    const bigSize = Phaser.Math.Clamp(min * 0.16, 58, 142);
    const smallSize = Phaser.Math.Clamp(min * 0.105, 38, 86);
    const ivySize = Phaser.Math.Clamp(min * 0.12, 46, 102);

    const big = new Plant(
      this,
      width * (isNarrow ? 0.115 : 0.105),
      height * 0.825,
      bigSize,
      planterStyle,
      'fern',
      this.handlePlantTouch,
      this.reducedMotion,
      11,
    );
    this.foregroundLayer.add(big.container);
    this.plants.set('fern', big);

    const lavender = new Plant(
      this,
      width * (isNarrow ? 0.4 : 0.405),
      height * 0.815,
      smallSize,
      'lavender',
      'lavender',
      this.handlePlantTouch,
      this.reducedMotion,
      31,
    );
    this.foregroundLayer.add(lavender.container);
    this.plants.set('lavender', lavender);

    const ivy = new Plant(
      this,
      width * (isNarrow ? 0.93 : 0.94),
      height * 0.72,
      ivySize,
      'ivy',
      'ivy',
      this.handlePlantTouch,
      this.reducedMotion,
      71,
    );
    this.foregroundLayer.add(ivy.container);
    this.plants.set('ivy', ivy);
  }

  private readonly handlePlantTouch = (plant: PlantId): void => {
    gameEvents.emit('game:plant-touched', { plant });
    const target = this.plants.get(plant);
    if (target) {
      this.spawnBurst(
        target.container.x,
        target.container.y - 26,
        [COLORS.sage, COLORS.amber],
        8,
        30,
      );
    }
  };

  private buildCat(): void {
    const { width, height, min, isNarrow } = this.bounds;
    const size = Phaser.Math.Clamp(min * 0.145, 55, 132);
    const x = width * (isNarrow ? 0.52 : 0.55);
    const y = height * 0.858;

    const cushion = this.add.graphics();
    const cushionWidth = size * 2.05;
    const cushionHeight = size * 0.66;
    cushion.fillStyle(0x5e4b69, 0.95);
    cushion.fillEllipse(x, y + size * 0.24, cushionWidth, cushionHeight);
    cushion.fillStyle(COLORS.rose, 0.28);
    cushion.fillEllipse(x, y + size * 0.18, cushionWidth * 0.86, cushionHeight * 0.72);
    cushion.lineStyle(1.2, COLORS.rose, 0.32);
    cushion.strokeEllipse(x, y + size * 0.24, cushionWidth * 0.9, cushionHeight * 0.82);
    this.foregroundLayer.add(cushion);

    this.cat = new Cat(
      this,
      x,
      y,
      size,
      (reaction: CatReactionId) => {
        gameEvents.emit('game:cat-petted', { reaction });
      },
      this.reducedMotion,
      () => this.chaseFirefly(),
      () => this.investigateNearbyObject(),
    );
    this.foregroundLayer.add(this.cat.container);
  }

  private chaseFirefly(): boolean {
    if (!this.cat || this.reducedMotion) return false;
    const available = this.fireflies.filter((firefly) => firefly.active && firefly.visible);
    const target = available.sort(
      (a, b) =>
        Phaser.Math.Distance.Between(this.cat?.x ?? 0, this.cat?.y ?? 0, a.x, a.y) -
        Phaser.Math.Distance.Between(this.cat?.x ?? 0, this.cat?.y ?? 0, b.x, b.y),
    )[0];
    if (!target) return false;

    const startX = target.x;
    const startY = target.y;
    this.tweens.killTweensOf(target);
    this.tweens.add({
      targets: target,
      x: this.cat.x - this.bounds.min * 0.12,
      y: this.cat.y - this.bounds.min * 0.08,
      duration: 950,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (!target.active || !this.built) return;
        this.tweens.add({
          targets: target,
          x: startX,
          y: startY,
          duration: 1600,
          ease: 'Sine.easeInOut',
          onComplete: () => this.fireflyDrift.get(target)?.(),
        });
      },
    });
    return true;
  }

  private investigateNearbyObject(): number | null {
    if (!this.cat) return null;
    const closest = [...this.hiddenObjects.values()]
      .filter((object) => !object.isFound)
      .sort(
        (a, b) =>
          Phaser.Math.Distance.Between(this.cat?.x ?? 0, this.cat?.y ?? 0, a.container.x, a.container.y) -
          Phaser.Math.Distance.Between(this.cat?.x ?? 0, this.cat?.y ?? 0, b.container.x, b.container.y),
      )[0];
    if (!closest) return null;
    return closest.container.x < this.cat.x ? -6 : 6;
  }

  private buildTelescope(): void {
    const { width, height, min, isNarrow } = this.bounds;
    const size = Phaser.Math.Clamp(min * 0.15, 52, 132);
    const x = width * (isNarrow ? 0.8 : 0.79);
    const y = height * 0.845;
    const container = this.add.container(x, y);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x060a16, 0.42);
    shadow.fillEllipse(0, size * 0.22, size * 1.75, size * 0.38);
    container.add(shadow);

    const tripod = this.add.graphics();
    const pivotY = -size * 0.92;
    tripod.lineStyle(Math.max(2.4, size * 0.042), 0x343b58, 1);
    tripod.beginPath();
    tripod.moveTo(0, pivotY);
    tripod.lineTo(-size * 0.48, size * 0.1);
    tripod.moveTo(0, pivotY);
    tripod.lineTo(size * 0.46, size * 0.1);
    tripod.moveTo(0, pivotY);
    tripod.lineTo(size * 0.06, size * 0.16);
    tripod.strokePath();
    tripod.lineStyle(1, 0x697298, 0.4);
    tripod.beginPath();
    tripod.moveTo(0, pivotY);
    tripod.lineTo(-size * 0.47, size * 0.08);
    tripod.moveTo(0, pivotY);
    tripod.lineTo(size * 0.45, size * 0.08);
    tripod.strokePath();
    container.add(tripod);

    const mount = this.add.graphics();
    mount.fillStyle(0x3e4668, 1);
    mount.fillCircle(0, pivotY, size * 0.14);
    mount.fillStyle(0x6e7699, 0.7);
    mount.fillCircle(-size * 0.03, pivotY - size * 0.03, size * 0.06);
    container.add(mount);

    const tube = this.add.container(0, pivotY);
    tube.setAngle(-38);
    const tubeGraphics = this.add.graphics();
    const length = size * 1.18;
    const thickness = size * 0.21;
    tubeGraphics.fillStyle(0x4b3e4d, 1);
    tubeGraphics.fillRoundedRect(-length * 0.48, -thickness * 0.5, length, thickness, thickness * 0.4);
    tubeGraphics.fillStyle(0x6c5a57, 1);
    tubeGraphics.fillRoundedRect(-length * 0.48, -thickness * 0.42, length * 0.94, thickness * 0.35, thickness * 0.25);
    tubeGraphics.fillStyle(0x2a2638, 1);
    tubeGraphics.fillRoundedRect(length * 0.32, -thickness * 0.58, length * 0.18, thickness * 1.16, 3);
    tubeGraphics.fillStyle(0x9cb0cf, 0.6);
    tubeGraphics.fillEllipse(length * 0.5, 0, thickness * 0.2, thickness * 0.88);
    tubeGraphics.fillStyle(COLORS.cream, 0.35);
    tubeGraphics.fillEllipse(length * 0.5, -thickness * 0.08, thickness * 0.09, thickness * 0.46);
    tubeGraphics.lineStyle(1.2, 0xc7a778, 0.55);
    tubeGraphics.strokeEllipse(length * 0.5, 0, thickness * 0.22, thickness * 0.94);
    tubeGraphics.fillStyle(0xc7a778, 0.85);
    tubeGraphics.fillRect(-length * 0.18, -thickness * 0.5, length * 0.035, thickness);
    tubeGraphics.fillRect(length * 0.12, -thickness * 0.5, length * 0.03, thickness);
    tubeGraphics.lineStyle(1, COLORS.amber, 0.35);
    tubeGraphics.strokeRoundedRect(-length * 0.48, -thickness * 0.5, length, thickness, thickness * 0.4);
    tube.add(tubeGraphics);
    container.add(tube);

    const glow = this.add
      .image(0, 0, 'rooftop-glow')
      .setDisplaySize(size * 2.2, size * 2.2)
      .setTint(COLORS.amber)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    container.add(glow);

    const zone = this.add
      .zone(0, -size * 0.55, size * 1.7, size * 1.7)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      this.tweens.add({ targets: glow, alpha: 0.16, duration: 240 });
    });
    zone.on('pointerout', () => {
      this.tweens.add({ targets: glow, alpha: 0, duration: 280 });
    });
    zone.on('pointerdown', () => {
      gameEvents.emit('game:telescope-open', undefined);
      this.tweens.add({
        targets: container,
        scale: 1.02,
        duration: 160,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    });
    container.add(zone);

    this.foregroundLayer.add(container);
  }

  private buildHiddenObjects(): void {
    const { width, height, min } = this.bounds;
    for (const item of HIDDEN_DISCOVERIES) {
      const position = HIDDEN_POSITIONS[item.id];
      if (!position) continue;
      const id = item.id;
      const size = Phaser.Math.Clamp(min * position.size, 16, 42);
      const object = new HiddenObject(
        this,
        width * position.x,
        height * position.y,
        size,
        id,
        (hiddenId) => {
          gameEvents.emit('game:hidden-found', { id: hiddenId });
        },
        this.reducedMotion,
      );
      this.foregroundLayer.add(object.container);
      this.hiddenObjects.set(id, object);
      if (this.state.hidden.includes(id)) object.markFound(false);
    }
  }

  private buildFireflies(): void {
    const { width, height, isNarrow } = this.bounds;
    const homes: Array<{ x: number; y: number }> = [
      { x: width * 0.17, y: height * 0.7 },
      { x: width * 0.35, y: height * 0.72 },
      { x: width * 0.49, y: height * 0.68 },
      { x: width * (isNarrow ? 0.91 : 0.87), y: height * 0.64 },
    ];
    for (const home of homes) {
      this.spawnFirefly(home.x, home.y);
    }
  }

  private spawnFirefly(x: number, y: number): void {
    const container = this.add.container(x, y);
    const glow = this.add
      .image(0, 0, 'rooftop-glow')
      .setDisplaySize(42, 42)
      .setTint(0xffd57d)
      .setAlpha(0.32)
      .setBlendMode(Phaser.BlendModes.ADD);
    const core = this.add.circle(0, 0, 1.9, 0xffefb5, 1);
    container.add(glow);
    container.add(core);

    const zone = this.add
      .zone(0, 0, 38, 38)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    container.add(zone);
    this.atmosphereLayer.add(container);
    this.fireflies.push(container);

    if (!this.reducedMotion) {
      this.tweens.add({
        targets: glow,
        alpha: 0.16,
        duration: 900 + Math.random() * 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const drift = (): void => {
      if (!container.active || !container.visible || !this.built) return;
      const { width, height } = this.bounds;
      const targetX = Phaser.Math.Clamp(x + (Math.random() - 0.5) * width * 0.12, 20, width - 20);
      const targetY = Phaser.Math.Clamp(
        y + (Math.random() - 0.5) * height * 0.09,
        height * 0.58,
        height * 0.82,
      );
      this.tweens.add({
        targets: container,
        x: targetX,
        y: targetY,
        duration: 3200 + Math.random() * 3000,
        ease: 'Sine.easeInOut',
        onComplete: drift,
      });
    };
    this.fireflyDrift.set(container, drift);
    if (!this.reducedMotion) this.time.delayedCall(500 + Math.random() * 1800, drift);

    zone.on('pointerdown', () => {
      if (!container.active) return;
      gameEvents.emit('game:firefly-caught', undefined);
      this.spawnBurst(container.x, container.y, [0xffd57d, COLORS.cream], 9, 28);
      const catchX = container.x;
      const catchY = container.y;
      this.tweens.killTweensOf(container);
      const index = this.fireflies.indexOf(container);
      if (index >= 0) this.fireflies.splice(index, 1);
      container.destroy(true);
      this.time.delayedCall(2800 + Math.random() * 2600, () => {
        if (!this.built) return;
        const { width, height } = this.bounds;
        this.spawnFirefly(
          Phaser.Math.Clamp(catchX + (Math.random() - 0.5) * width * 0.12, 24, width - 24),
          Phaser.Math.Clamp(catchY + (Math.random() - 0.5) * height * 0.06, height * 0.61, height * 0.82),
        );
      });
    });
  }

  private buildAtmosphereMotes(): void {
    const { width, height, min } = this.bounds;
    const random = createRandom(512);
    for (let i = 0; i < 12; i += 1) {
      const mote = this.add.circle(
        random() * width,
        height * (0.58 + random() * 0.38),
        0.8 + random() * 1.1,
        i % 3 === 0 ? COLORS.amber : COLORS.lavenderLight,
        0.08 + random() * 0.12,
      );
      this.atmosphereLayer.add(mote);
      if (this.reducedMotion) continue;
      const drift = 10 + random() * 24;
      this.tweens.add({
        targets: mote,
        x: mote.x + (random() - 0.5) * width * 0.08,
        y: mote.y - drift,
        alpha: { from: mote.alpha, to: 0.02 },
        duration: 6500 + random() * 6000,
        yoyo: true,
        repeat: -1,
        delay: random() * 4500,
        ease: 'Sine.easeInOut',
      });
    }

    const grassTint = this.add
      .rectangle(0, height - min * 0.02, width, min * 0.06, 0x060914, 0.15)
      .setOrigin(0, 1);
    this.atmosphereLayer.add(grassTint);
  }

  private applyLights(immediate: boolean): void {
    const on = this.state.lightsOn;
    const targetAlpha = on ? 1 : 0;
    const veilTarget = on ? 0 : 0.17;
    this.tweens.killTweensOf(this.lightsGlowLayer);
    this.tweens.killTweensOf(this.nightVeil);
    if (immediate || this.reducedMotion) {
      this.lightsGlowLayer.setAlpha(targetAlpha);
      this.nightVeil.setAlpha(veilTarget);
      return;
    }
    this.tweens.add({
      targets: this.lightsGlowLayer,
      alpha: targetAlpha,
      duration: 900,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: this.nightVeil,
      alpha: veilTarget,
      duration: 700,
      ease: 'Sine.easeInOut',
    });
  }

  private spawnBurst(
    x: number,
    y: number,
    colors: readonly number[],
    count: number,
    radius: number,
  ): void {
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const distance = radius * (0.4 + Math.random() * 0.9);
      const dot = this.add.circle(
        x,
        y,
        Math.max(1, 1 + Math.random() * 1.6),
        colors[Math.floor(Math.random() * colors.length)] ?? COLORS.cream,
        0.9,
      );
      dot.setDepth(28);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.3,
        duration: 600 + Math.random() * 500,
        ease: 'Cubic.easeOut',
        onComplete: () => dot.destroy(),
      });
    }
  }
}
