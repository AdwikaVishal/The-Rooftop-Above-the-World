import Phaser from 'phaser';
import type { SceneState } from '../types/world';
import { RooftopScene } from './scenes/RooftopScene';

export function createGameConfig(
  parent: HTMLElement,
  initialState: SceneState,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#0b1022',
    banner: false,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: Math.max(320, parent.clientWidth),
      height: Math.max(320, parent.clientHeight),
    },
    render: {
      antialias: true,
      antialiasGL: true,
      pixelArt: false,
      roundPixels: false,
      powerPreference: 'high-performance',
      transparent: false,
    },
    fps: {
      target: 60,
      min: 30,
    },
    input: {
      activePointers: 2,
    },
    audio: {
      noAudio: true,
    },
    callbacks: {
      preBoot: (game) => {
        game.registry.set('rooftopSceneState', initialState);
      },
    },
    scene: [RooftopScene],
  };
}
