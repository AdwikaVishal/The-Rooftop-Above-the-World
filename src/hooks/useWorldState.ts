import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyWorldAction,
  createInitialState,
  detectNewNotices,
  totalDiscoveries,
} from '../game/systems/DiscoverySystem';
import { audioService } from '../services/audioService';
import { clearWorldState, loadWorldState, saveWorldState } from '../services/saveService';
import type { DiscoveryNotice, WorldAction, WorldState } from '../types/world';

export interface WorldStateController {
  state: WorldState;
  notices: DiscoveryNotice[];
  total: number;
  dispatch: (action: WorldAction) => void;
  dismissNotice: (id: string) => void;
  resetWorld: () => void;
}

export function useWorldState(): WorldStateController {
  const [state, setState] = useState<WorldState>(() => loadWorldState() ?? createInitialState());
  const [notices, setNotices] = useState<DiscoveryNotice[]>([]);
  const stateRef = useRef(state);

  const dispatch = useCallback((action: WorldAction): void => {
    const previous = stateRef.current;
    const next = applyWorldAction(previous, action);
    if (next === previous) return;

    stateRef.current = next;
    setState(next);
    saveWorldState(next);

    const fresh = detectNewNotices(previous, next);
    if (fresh.length > 0) {
      setNotices((current) => [...current, ...fresh]);
      if (fresh.some((notice) => notice.kind === 'unlock')) {
        audioService.chime('unlock');
      } else if (
        fresh.some(
          (notice) =>
            notice.kind === 'celestial' ||
            notice.kind === 'constellation' ||
            notice.kind === 'hidden',
        )
      ) {
        audioService.chime('discovery');
      } else if (action.type === 'pet-cat') {
        audioService.purr();
      }
    } else if (action.type === 'pet-cat') {
      audioService.purr();
    } else if (action.type === 'touch-plant') {
      audioService.chime('plant');
    } else if (action.type === 'click-moon') {
      audioService.chime('moon');
    }
  }, []);

  useEffect(() => {
    dispatch({ type: 'visit' });
  }, [dispatch]);

  const dismissNotice = useCallback((id: string): void => {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);

  const resetWorld = useCallback((): void => {
    clearWorldState();
    setNotices([]);
    dispatch({ type: 'reset' });
  }, [dispatch]);

  return {
    state,
    notices,
    total: totalDiscoveries(state),
    dispatch,
    dismissNotice,
    resetWorld,
  };
}
