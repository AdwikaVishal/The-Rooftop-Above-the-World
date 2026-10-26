import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { CustomizationPanel } from '../components/CustomizationPanel';
import { DiscoveryToast } from '../components/DiscoveryToast';
import { EscapeOverlay } from '../components/EscapeOverlay';
import { GameCanvas } from '../components/GameCanvas';
import { GardenPanel } from '../components/GardenPanel';
import { HUD } from '../components/HUD';
import { JournalPanel } from '../components/JournalPanel';
import { SettingsPanel } from '../components/SettingsPanel';
import { SanctuaryPanel } from '../components/SanctuaryPanel';
import { StoriesPanel } from '../components/StoriesPanel';
import { TogetherPanel } from '../components/TogetherPanel';
import { TelescopeView } from '../components/TelescopeView';
import { gameEvents } from '../game/EventBus';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useWorldState } from '../hooks/useWorldState';
import { audioService } from '../services/audioService';
import type {
  CatReactionId,
  CelestialId,
  ConstellationId,
  DecorationCategory,
  DecorationId,
  FeelingId,
  GardenSeed,
  GardenWeather,
  IslandId,
  PlantId,
} from '../types/world';
import type { PanelId } from '../types/ui';

const DreamscapeCanvas = lazy(() =>
  import('../dreamscape/DreamscapeCanvas').then((module) => ({
    default: module.DreamscapeCanvas,
  })),
);

function hasUnsavedFormValues(): boolean {
  const dialog = document.querySelector('[role="dialog"]');
  if (!dialog) return false;
  return Array.from(dialog.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    'input, textarea, select',
  )).some((control) => {
    if (control instanceof HTMLInputElement && ['checkbox', 'radio'].includes(control.type)) {
      return String(control.checked) !== control.dataset.modalInitialChecked;
    }
    return control.value !== control.dataset.modalInitialValue;
  });
}

export function App() {
  const { state, notices, total, dispatch, dismissNotice, resetWorld } = useWorldState();
  const reducedMotion = useReducedMotion();
  const [panel, setPanel] = useState<PanelId>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [dreamscapeActive, setDreamscapeActive] = useState(false);
  const [quietMode, setQuietMode] = useState(false);
  const [escapeOpen, setEscapeOpen] = useState(false);
  const [escapeForceOpen, setEscapeForceOpen] = useState(false);
  const soundOnRef = useRef(false);
  const panelEscapeHandler = useRef<(() => boolean) | null>(null);
  const dreamscapeEscapeHandler = useRef<(() => boolean) | null>(null);

  const registerPanelEscapeLayer = useCallback((handler: (() => boolean) | null) => {
    panelEscapeHandler.current = handler;
  }, []);
  const registerDreamscapeEscapeLayer = useCallback((handler: (() => boolean) | null) => {
    dreamscapeEscapeHandler.current = handler;
  }, []);
  const exitDreamscape = useCallback(() => {
    if (dreamscapeEscapeHandler.current?.()) return;
    setDreamscapeActive(false);
  }, []);

  const closePanel = useCallback(() => {
    if (hasUnsavedFormValues() && !window.confirm('Close this panel and discard your unsaved changes?')) return;
    setPanel(null);
  }, []);
  const openPanel = useCallback((next: Exclude<PanelId, null>) => setPanel(next), []);

  const plantSeed = useCallback(
    (plotId: string, seed: GardenSeed, note?: string, feeling?: FeelingId) => {
      const action: import('../types/world').WorldAction = {
        type: 'plant-seed',
        plotId,
        seed,
      };
      if (note && note.trim()) action.note = note;
      if (feeling) action.feeling = feeling;
      dispatch(action);
    },
    [dispatch],
  );

  const updatePlotNote = useCallback(
    (plotId: string, note: string, feeling?: FeelingId | null) => {
      const action: import('../types/world').WorldAction = {
        type: 'update-plot-note',
        plotId,
        note,
      };
      if (feeling) action.feeling = feeling;
      dispatch(action);
    },
    [dispatch],
  );

  const unlockGreenhouse = useCallback(() => dispatch({ type: 'unlock-greenhouse' }), [dispatch]);
  const unlockPond = useCallback(() => dispatch({ type: 'unlock-pond' }), [dispatch]);
  const addWish = useCallback((note: string) => dispatch({ type: 'add-garden-wish', note }), [dispatch]);
  const addMemory = useCallback(
    (title: string, note: string, plotId?: string | null) => {
      dispatch({
        type: 'add-garden-memory',
        memory: {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          plotId: plotId ?? null,
          decorationSlot: null,
          title,
          note,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          private: true,
        },
      });
    },
    [dispatch],
  );
  const decorateCat = useCallback(
    (item: 'cushion' | 'scratching-post' | 'cat-plant') => dispatch({ type: 'decorate-cat-corner', item }),
    [dispatch],
  );
  const sitAtSpot = useCallback((spot: any) => dispatch({ type: 'sit-at-spot', spot }), [dispatch]);
  const gardenGrowthTick = useCallback(() => dispatch({ type: 'garden-growth-tick' }), [dispatch]);

  const waterPlot = useCallback(
    (plotId: string) => {
      dispatch({ type: 'water-plot', plotId });
    },
    [dispatch],
  );

  const setGardenWeather = useCallback(
    (weather: GardenWeather) => {
      dispatch({ type: 'set-garden-weather', weather });
    },
    [dispatch],
  );

  const toggleLights = useCallback(() => {
    dispatch({ type: 'toggle-lights' });
  }, [dispatch]);

  const toggleSound = useCallback(() => {
    const next = !soundOnRef.current;
    soundOnRef.current = next;
    setSoundOn(next);
    void audioService.setEnabled(next);
  }, []);

  const openTelescope = useCallback(() => {
    setPanel('telescope');
    dispatch({ type: 'opened-telescope' });
  }, [dispatch]);

  const toggleDreamscape = useCallback(() => {
    setPanel(null);
    setDreamscapeActive((active) => !active);
  }, []);

  const enterQuietMode = useCallback(() => {
    setQuietMode(true);
    setPanel(null);
    setEscapeOpen(false);
  }, []);

  const leaveQuietMode = useCallback(() => setQuietMode(false), []);

  const openEscape = useCallback(() => {
    setEscapeForceOpen(false);
    setEscapeOpen(true);
  }, []);

  const settleCat = useCallback(() => {
    dispatch({ type: 'pet-cat', reaction: 'purr' });
    audioService.purr();
  }, [dispatch]);

  const discoverConstellation = useCallback(
    (id: ConstellationId) => {
      dispatch({ type: 'discover-constellation', id });
    },
    [dispatch],
  );

  const discoverCelestial = useCallback(
    (id: CelestialId) => dispatch({ type: 'discover-celestial', id }),
    [dispatch],
  );
  const visitIsland = useCallback(
    (id: IslandId) => dispatch({ type: 'visit-island', id }),
    [dispatch],
  );
  const petCat = useCallback(
    (reaction: CatReactionId) => dispatch({ type: 'pet-cat', reaction }),
    [dispatch],
  );
  const touchPlant = useCallback(
    (plant: PlantId) => dispatch({ type: 'touch-plant', plant }),
    [dispatch],
  );
  const catchFirefly = useCallback(() => dispatch({ type: 'catch-firefly' }), [dispatch]);

  const selectDecoration = useCallback(
    (category: DecorationCategory, id: DecorationId) => {
      dispatch({ type: 'select-decoration', category, id });
    },
    [dispatch],
  );

  const handleReset = useCallback(() => {
    resetWorld();
  }, [resetWorld]);

  useEffect(() => {
    const unsubscribers = [
      gameEvents.on('game:cat-petted', ({ reaction }) => {
        dispatch({ type: 'pet-cat', reaction });
      }),
      gameEvents.on('game:plant-touched', ({ plant }) => {
        dispatch({ type: 'touch-plant', plant });
      }),
      gameEvents.on('game:hidden-found', ({ id }) => {
        dispatch({ type: 'find-hidden', id });
      }),
      gameEvents.on('game:moon-clicked', () => {
        dispatch({ type: 'click-moon' });
      }),
      gameEvents.on('game:firefly-caught', () => {
        dispatch({ type: 'catch-firefly' });
      }),
      gameEvents.on('game:telescope-open', () => {
        openTelescope();
      }),
      gameEvents.on('game:lights-request', () => {
        dispatch({ type: 'toggle-lights' });
      }),
    ];

    return () => {
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
  }, [dispatch, openTelescope]);

  useEffect(() => {
    audioService.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    const handleVisibility = (): void => {
      audioService.setPageVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.defaultPrevented) return;

      if (event.key === 'Escape') {
        if (document.querySelector('dialog[open]')) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (escapeOpen) {
          setEscapeOpen(false);
          return;
        }
        if (panel) {
          if (panelEscapeHandler.current?.()) return;
          closePanel();
          return;
        }
        if (dreamscapeActive) {
          exitDreamscape();
        }
        return;
      }
      if (panel || dreamscapeActive || escapeOpen) return;

      switch (event.key.toLowerCase()) {
        case 'j':
          event.preventDefault();
          openPanel('journal');
          break;
        case 'g':
          event.preventDefault();
          openPanel('garden');
          break;
        case 'c':
          event.preventDefault();
          openPanel('customize');
          break;
        case 'h':
        case '?':
          event.preventDefault();
          openPanel('guide');
          break;
        case 't':
          event.preventDefault();
          openTelescope();
          break;
        case 's':
          event.preventDefault();
          openPanel('sanctuary');
          break;
        case 'l':
          event.preventDefault();
          toggleLights();
          break;
        case 'm':
          event.preventDefault();
          toggleSound();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [closePanel, dreamscapeActive, escapeOpen, exitDreamscape, openPanel, openTelescope, panel, toggleLights, toggleSound]);

  const notice = notices[0] ?? null;
  const dismissCurrentNotice = useCallback(() => {
    if (notice) dismissNotice(notice.id);
  }, [dismissNotice, notice]);

  return (
    <main className={`rooftop-app${quietMode ? ' is-staying' : ''}`}>
      {!dreamscapeActive && <GameCanvas state={state} reducedMotion={reducedMotion} />}
      {dreamscapeActive && (
        <Suspense
          fallback={
            <div className="dreamscape-loading" role="status">
              Opening the wider night…
            </div>
          }
        >
          <DreamscapeCanvas
            state={state}
            reducedMotion={reducedMotion}
            onRegisterEscapeLayer={registerDreamscapeEscapeLayer}
            onDiscoverConstellation={discoverConstellation}
            onDiscoverCelestial={discoverCelestial}
            onClickMoon={() => dispatch({ type: 'click-moon' })}
            onVisitIsland={visitIsland}
            onPetCat={petCat}
            onTouchPlant={touchPlant}
            onCatchFirefly={catchFirefly}
            onOpenTelescope={openTelescope}
            onReturnHome={exitDreamscape}
          />
        </Suspense>
      )}

      <HUD
        total={total}
        lightsOn={state.lightsOn}
        soundOn={soundOn}
        onOpenJournal={() => openPanel('journal')}
        onOpenGarden={() => openPanel('garden')}
        onOpenCustomize={() => openPanel('customize')}
        onOpenGuide={() => openPanel('guide')}
        onOpenSanctuary={() => openPanel('sanctuary')}
        onOpenEscape={openEscape}
        onOpenStories={() => openPanel('stories')}
        onOpenTogether={() => openPanel('together')}
        onToggleLights={toggleLights}
        onToggleSound={toggleSound}
        onExploreSky={toggleDreamscape}
        dreamscapeActive={dreamscapeActive}
        quietMode={quietMode}
        onLeaveQuietMode={leaveQuietMode}
      />

      {notice && (
        <div className="toast-stack" aria-label="Recent discoveries">
          <DiscoveryToast notice={notice} onDismiss={dismissCurrentNotice} />
        </div>
      )}

      {panel === 'journal' && (
        <JournalPanel state={state} total={total} onClose={closePanel} />
      )}
      {panel === 'garden' && (
        <GardenPanel
          state={state}
          onPlantSeed={plantSeed}
          onWaterPlot={waterPlot}
          onSetWeather={setGardenWeather}
          onUpdatePlotNote={updatePlotNote}
          onUnlockGreenhouse={unlockGreenhouse}
          onUnlockPond={unlockPond}
          onRegisterEscapeLayer={registerPanelEscapeLayer}
          onAddWish={addWish}
          onAddMemory={addMemory}
          onDecorateCat={decorateCat}
          onSit={sitAtSpot}
          onGrowthTick={gardenGrowthTick}
          onClose={closePanel}
        />
      )}
      {panel === 'customize' && (
        <CustomizationPanel
          state={state}
          selections={state.selections}
          onSelect={selectDecoration}
          onClose={closePanel}
        />
      )}
      {panel === 'guide' && (
        <SettingsPanel
          total={total}
          soundOn={soundOn}
          reducedMotion={reducedMotion}
          onToggleSound={toggleSound}
          onReset={handleReset}
          onClose={closePanel}
        />
      )}
      {panel === 'telescope' && (
        <TelescopeView
          state={state}
          reducedMotion={reducedMotion}
          onFound={discoverConstellation}
          onClose={closePanel}
        />
      )}
      {panel === 'sanctuary' && (
        <SanctuaryPanel
          reducedMotion={reducedMotion}
          soundOn={soundOn}
          onToggleSound={toggleSound}
          onQuietMode={enterQuietMode}
          onSettleCat={settleCat}
          onClose={closePanel}
        />
      )}
      {panel === 'stories' && <StoriesPanel onClose={closePanel} />}
      {panel === 'together' && <TogetherPanel onClose={closePanel} />}
      <EscapeOverlay
        open={escapeOpen}
        forceOpen={escapeForceOpen}
        onClose={() => setEscapeOpen(false)}
        onSettleCat={settleCat}
        onEnterQuietMode={enterQuietMode}
      />

      <div className="app-grain" aria-hidden="true" />
    </main>
  );
}
