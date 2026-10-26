import { useEffect, useMemo, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from '../game/config';
import { gameEvents } from '../game/EventBus';
import type { SceneState, WorldState } from '../types/world';

interface GameCanvasProps {
  state: WorldState;
  reducedMotion: boolean;
}

function toSceneState(state: WorldState): SceneState {
  return {
    hidden: state.hidden,
    lightsOn: state.lightsOn,
    selections: state.selections,
    celestial: state.celestial,
    constellations: state.constellations,
  };
}

export function GameCanvas({ state, reducedMotion }: GameCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const latestState = useRef(state);
  latestState.current = state;

  const sceneState = useMemo(() => toSceneState(state), [
    state.hidden,
    state.lightsOn,
    state.selections,
    state.celestial,
    state.constellations,
  ]);

  useEffect(() => {
    const parent = mountRef.current;
    if (!parent) return;

    let cancelled = false;
    let game: Phaser.Game | null = null;
    const unsubscribe = gameEvents.on('game:ready', () => {
      if (cancelled) return;
      setReady(true);
      gameEvents.emit('app:sync', toSceneState(latestState.current));
      gameEvents.emit('app:reduced-motion', window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    });

    const frame = window.requestAnimationFrame(() => {
      if (cancelled) return;
      game = new Phaser.Game(createGameConfig(parent, toSceneState(latestState.current)));
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      unsubscribe();
      if (game) game.destroy(true);
      parent.replaceChildren();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    gameEvents.emit('app:sync', sceneState);
  }, [ready, sceneState]);

  useEffect(() => {
    if (!ready) return;
    gameEvents.emit('app:reduced-motion', reducedMotion);
  }, [ready, reducedMotion]);

  return (
    <div
      className="game-shell"
      role="img"
      aria-label="An interactive nighttime rooftop garden with a cat, plants, a telescope, and a view of the city."
    >
      <div ref={mountRef} className="game-mount" aria-hidden="true" />
      <div className={`game-loading ${ready ? 'is-ready' : ''}`} aria-hidden={ready}>
        <span className="loading-moon" aria-hidden="true" />
        <p>The rooftop is waking&hellip;</p>
      </div>
      <div className="game-texture" aria-hidden="true" />
    </div>
  );
}
