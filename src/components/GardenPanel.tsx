import { useEffect, useState } from 'react';
import {
  BookHeart,
  CloudMoon,
  CloudRain,
  Droplets,
  Feather,
  Flower2,
  Heart,
  Leaf,
  NotebookPen,
  Shell,
  Sparkles,
  Star,
  Wind,
  X,
} from 'lucide-react';
import { FEELINGS } from '../data/feelings';
import { GARDEN_CREATURES, GARDEN_PLANT_BY_ID } from '../data/garden';
import type { FeelingId, GardenSeed, GardenWeather, WorldState } from '../types/world';
import { Modal, PanelHeader } from './Modal';

interface GardenPanelProps {
  state: WorldState;
  onPlantSeed: (plotId: string, seed: GardenSeed, note?: string, feeling?: FeelingId) => void;
  onWaterPlot: (plotId: string) => void;
  onSetWeather: (weather: GardenWeather) => void;
  onClose: () => void;
  onUpdatePlotNote?: (plotId: string, note: string, feeling?: FeelingId | null) => void;
  onUnlockGreenhouse?: () => void;
  onUnlockPond?: () => void;
  onAddWish?: (note: string) => void;
  onAddMemory?: (title: string, note: string, plotId?: string | null) => void;
  onDecorateCat?: (item: 'cushion' | 'scratching-post' | 'cat-plant') => void;
  onSit?: (spot: 'bench' | 'swing' | 'blanket' | 'tea-table' | null) => void;
  onGrowthTick?: () => void;
  onRegisterEscapeLayer?: (handler: (() => boolean) | null) => void;
}

const SEED_OPTIONS: Array<{ id: GardenSeed; name: string; blurb: string }> = [
  { id: 'fern', name: 'Fern', blurb: 'Soft fronds for the shadiest corner.' },
  { id: 'lavender', name: 'Lavender', blurb: 'A quiet, sweet little sway in the breeze.' },
  { id: 'ivy', name: 'Ivy', blurb: 'A trailing, steady vine with a gentle climb.' },
  { id: 'moonflower', name: 'Moonflower', blurb: 'White petals that open for the night.' },
];

const WEATHER_OPTIONS: Array<{ id: GardenWeather; label: string; icon: typeof CloudMoon }> = [
  { id: 'clear', label: 'Clear evening', icon: Sparkles },
  { id: 'breeze', label: 'A light breeze', icon: Wind },
  { id: 'mist', label: 'Moonlit mist', icon: CloudMoon },
  { id: 'rain', label: 'Soft rain', icon: CloudRain },
  { id: 'meteor-shower', label: 'Meteor shower', icon: Star },
];

const STAGE_LABELS = ['Seed', 'Sprouting', 'Blooming', 'Thriving'];
const CREATURE_ICONS = {
  frog: Leaf,
  butterfly: Flower2,
  snail: Shell,
  firefly: Sparkles,
} as const;

export function GardenPanel({
  state,
  onPlantSeed,
  onWaterPlot,
  onSetWeather,
  onClose,
  onUpdatePlotNote,
  onUnlockGreenhouse,
  onUnlockPond,
  onAddWish,
  onAddMemory,
  onDecorateCat,
  onSit,
  onGrowthTick,
  onRegisterEscapeLayer,
}: GardenPanelProps) {
  const [plantingPlot, setPlantingPlot] = useState<string | null>(null);
  const [plantSeedId, setPlantSeedId] = useState<GardenSeed>('lavender');
  const [plantFeeling, setPlantFeeling] = useState<FeelingId | ''>('');
  const [plantNote, setPlantNote] = useState('');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [feelingDrafts, setFeelingDrafts] = useState<Record<string, FeelingId | ''>>({});
  const [wishNote, setWishNote] = useState('');
  const [memoryTitle, setMemoryTitle] = useState('');
  const [memoryNote, setMemoryNote] = useState('');
  const [memoryPlot, setMemoryPlot] = useState<string>('');

  useEffect(() => {
    if (!onRegisterEscapeLayer) return;
    const dismissPlanting = (): boolean => {
      if (!plantingPlot) return false;
      if ((plantNote.trim() || plantFeeling) && !window.confirm('Cancel planting and discard the unsaved note?')) {
        return true;
      }
      setPlantingPlot(null);
      return true;
    };
    onRegisterEscapeLayer(dismissPlanting);
    return () => onRegisterEscapeLayer(null);
  }, [onRegisterEscapeLayer, plantFeeling, plantNote, plantingPlot]);

  const startPlant = (plotId: string, seed: GardenSeed): void => {
    setPlantingPlot(plotId);
    setPlantSeedId(seed);
    setPlantFeeling('');
    setPlantNote('');
  };

  const confirmPlant = (): void => {
    if (!plantingPlot) return;
    onPlantSeed(plantingPlot, plantSeedId, plantNote, plantFeeling || undefined);
    setPlantingPlot(null);
    setPlantNote('');
    setPlantFeeling('');
  };

  const saveNote = (plotId: string): void => {
    if (!onUpdatePlotNote) return;
    const note = (noteDrafts[plotId] ?? '').slice(0, 500);
    const feeling = feelingDrafts[plotId];
    onUpdatePlotNote(plotId, note, feeling === '' ? null : feeling || null);
  };

  const bloomCount = state.garden.plots.filter((plot) => plot.seed && plot.stage >= 3).length;
  const hasGlow = state.garden.plots.some((plot) => plot.seed === 'glowing-mushrooms' && plot.stage >= 2);
  const creatures = state.garden.creatures ?? [];
  const discoveredCreatures = state.garden.creaturesDiscovered ?? [];
  const plantedCount = state.garden.plots.filter((plot) => plot.seed).length;
  const visitorNotes = [
    state.counters.firefliesCaught > 0 ? 'Fireflies drift around the pots.' : 'The air is still, but the plants are listening.',
    state.counters.catPets > 0 ? 'Whisker has been watching the garden.' : 'Whisker is waiting for the first small movement.',
    state.counters.plantsTouched.length >= 2 ? 'The garden already knows your rhythm.' : 'A few careful touches will wake the space up.',
  ];

  return (
    <Modal labelledBy="garden-title" onClose={onClose} className="garden-panel">
      <PanelHeader
        eyebrow="A living corner"
        title="The Rooftop Garden"
        titleId="garden-title"
        onClose={onClose}
        closeLabel="Close rooftop garden"
      >
        <p className="panel-intro">
          A few tiny pots, a little weather, and a lot of patient evening light. Plants here can represent memories and intentions.
        </p>
      </PanelHeader>

      <div className="garden-scroll" role="region" aria-label="Rooftop garden controls" tabIndex={0}>
        <section className="garden-summary" aria-labelledby="garden-overview">
          <div>
            <p className="garden-kicker" id="garden-overview">Garden mood</p>
            <h3>{plantedCount} of 4 pots are awake · {bloomCount} blooming</h3>
            <p className="garden-summary-sub">A living miniature ecosystem. No daily pressure.</p>
          </div>
          <div className="weather-row" role="group" aria-label="Garden weather preferences">
            {WEATHER_OPTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`weather-pill ${state.garden.weather === id ? 'is-selected' : ''}`}
                onClick={() => onSetWeather(id)}
                aria-pressed={state.garden.weather === id}
              >
                <Icon size={14} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          {onGrowthTick && (
            <button type="button" className="garden-action garden-action-quiet" onClick={onGrowthTick} style={{ marginTop: 10 }}>
              <Sparkles size={14} /> Check growth & visitors
            </button>
          )}
        </section>

        <section className="garden-section" aria-labelledby="garden-plots-title">
          <div className="section-heading">
            <span className="section-icon" aria-hidden="true">
              <Leaf size={18} strokeWidth={1.5} />
            </span>
            <div>
              <h3 id="garden-plots-title">Planting pots</h3>
              <p>Small seeds, slow growth, and lots of quiet care.</p>
            </div>
          </div>

          <div className="garden-grid">
            {state.garden.plots.map((plot, index) => {
              const stage = plot.seed ? Math.min(plot.stage, 4) : 0;
              const plantName = plot.seed ? GARDEN_PLANT_BY_ID.get(plot.seed)?.name ?? plot.seed : '';
              const currentNote = noteDrafts[plot.id] ?? plot.note ?? '';
              const currentFeeling = feelingDrafts[plot.id] ?? plot.feeling ?? '';
              return (
                <article key={plot.id} className={`garden-plot ${plot.seed ? 'is-planted' : 'is-empty'}`}>
                  <div className="plot-header">
                    <span>Pot {index + 1}</span>
                    <span>{plot.seed ? STAGE_LABELS[Math.min(stage - 1, STAGE_LABELS.length - 1)] : 'Empty'}</span>
                  </div>

                  {plot.seed ? (
                    <>
                      <div className="plot-plant" aria-hidden="true">
                        <Flower2 size={34} strokeWidth={1.3} />
                      </div>
                      <h4 className="plot-plant-name">{plantName}</h4>
                      <div
                        className="garden-stage"
                        role="progressbar"
                        aria-label={`${plantName} growth`}
                        aria-valuemin={0}
                        aria-valuemax={4}
                        aria-valuenow={stage}
                      >
                        <span style={{ width: `${(stage / 4) * 100}%` }} />
                      </div>
                      <div className="plot-diary">
                        <div className="plot-diary-head">
                          <BookHeart size={14} />
                          <span>Grow What You Feel</span>
                        </div>
                        {plot.feeling && (
                          <span className="plot-feeling-pill">
                            <Heart size={12} />
                            {FEELINGS.find((item) => item.id === plot.feeling)?.label ?? plot.feeling}
                          </span>
                        )}
                        <textarea
                          value={currentNote}
                          aria-label={`Private note for ${plantName}`}
                          onChange={(event) =>
                            setNoteDrafts((drafts) => ({ ...drafts, [plot.id]: event.target.value.slice(0, 500) }))
                          }
                          placeholder="What does this plant represent? A memory, intention, or something you want to hold..."
                          rows={3}
                        />
                        <div className="plot-feeling-row">
                          {FEELINGS.slice(0, 6).map((feeling) => (
                            <button
                              key={feeling.id}
                              type="button"
                              className={`plot-feeling-chip ${currentFeeling === feeling.id ? 'is-selected' : ''}`}
                              onClick={() =>
                                setFeelingDrafts((drafts) => ({
                                  ...drafts,
                                  [plot.id]: drafts[plot.id] === feeling.id ? '' : feeling.id,
                                }))
                              }
                            >
                              {feeling.label}
                            </button>
                          ))}
                        </div>
                        {onUpdatePlotNote && (
                          <button type="button" className="garden-action garden-action-quiet" onClick={() => saveNote(plot.id)}>
                            <NotebookPen size={14} /> Save to this plant
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        className="garden-action"
                        onClick={() => onWaterPlot(plot.id)}
                        disabled={stage >= 4}
                      >
                        {stage >= 4 ? 'Blooming now' : 'Water and tend'}
                      </button>
                    </>
                  ) : (
                    <div className="seed-picker">
                      {SEED_OPTIONS.map((seed) => (
                        <button
                          key={seed.id}
                          type="button"
                          className="seed-button"
                          onClick={() => startPlant(plot.id, seed.id)}
                        >
                          <span>{seed.name}</span>
                          <small>{seed.blurb}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="garden-section" aria-labelledby="garden-visitors-title">
          <div className="section-heading">
            <span className="section-icon" aria-hidden="true">
              <Sparkles size={18} strokeWidth={1.5} />
            </span>
            <div>
              <h3 id="garden-visitors-title">Tiny garden visitors</h3>
              <p>Frogs, butterflies, snails and fireflies discover your blooming garden.</p>
            </div>
          </div>
          <div className="creature-grid">
            {GARDEN_CREATURES.map((creature) => {
              const stateCreature = creatures.find((c) => c.id === creature.id);
              const discovered = discoveredCreatures.includes(creature.id) || stateCreature?.discovered;
              const active = stateCreature?.active || discovered;
              const CreatureIcon = CREATURE_ICONS[creature.id];
              return (
                <article key={creature.id} className={`creature-card ${discovered ? 'is-discovered' : active ? 'is-active' : 'is-hidden'}`}>
                  <span className="creature-art" aria-hidden="true">
                    <CreatureIcon size={19} />
                  </span>
                  <div>
                    <p className="creature-kicker">Garden visitor</p>
                    <h4>{discovered ? creature.name : 'A shy visitor'}</h4>
                    <p>{discovered ? creature.description : 'Appears when the garden blooms.'}</p>
                    {discovered && <span className="creature-behavior">{creature.behavior}</span>}
                  </div>
                  <span className="creature-status">{discovered ? 'Discovered' : active ? 'Nearby' : 'Hidden'}</span>
                </article>
              );
            })}
          </div>
          <ul className="visitor-list">
            {visitorNotes.map((item) => (
              <li key={item}>{item}</li>
            ))}
            {hasGlow && <li>Glowcap mushrooms cast a tiny lantern light for fireflies.</li>}
            {bloomCount >= 2 && <li>More flowers are attracting evening visitors.</li>}
          </ul>
        </section>

        <section className="garden-section" aria-labelledby="garden-spaces-title">
          <div className="section-heading">
            <span className="section-icon" aria-hidden="true">
              <Heart size={18} strokeWidth={1.5} />
            </span>
            <div>
              <h3 id="garden-spaces-title">Rest, wishes & memories</h3>
              <p>A place to sit, release a wish, or dedicate a plant to something meaningful.</p>
            </div>
          </div>
          <div className="garden-rest-grid">
            <div className="garden-rest-card">
              <h4>Little places to rest</h4>
              <div className="rest-spot-row">
                {[
                  { id: 'bench', label: 'Bench' },
                  { id: 'swing', label: 'Swing' },
                  { id: 'blanket', label: 'Blanket' },
                  { id: 'tea-table', label: 'Tea table' },
                ].map((spot) => (
                  <button
                    key={spot.id}
                    type="button"
                    className={`rest-spot-pill ${state.garden.sittingSpot === spot.id ? 'is-selected' : ''}`}
                    onClick={() => onSit?.(state.garden.sittingSpot === spot.id ? null : (spot.id as any))}
                    aria-pressed={state.garden.sittingSpot === spot.id}
                  >
                    {spot.label}
                  </button>
                ))}
              </div>
              <p className="garden-rest-note">Settling changes the camera mood. The cat may curl up nearby.</p>
            </div>
            <div className="garden-rest-card">
              <h4>Release a floating wish</h4>
              <div className="wish-row">
                <input aria-label="Floating wish" value={wishNote} onChange={(event) => setWishNote(event.target.value.slice(0, 200))} placeholder="A wish carried on a leaf..." />
                <button type="button" className="garden-action" onClick={() => { if (wishNote.trim() && onAddWish) { onAddWish(wishNote.trim()); setWishNote(''); } }}>
                  <Feather size={14} /> Release
                </button>
              </div>
              <div className="wish-list">
                {(state.garden.wishes ?? []).slice(-4).map((wish) => (
                  <span key={wish.id} className="wish-pill">{wish.note}</span>
                ))}
              </div>
            </div>
            <div className="garden-rest-card">
              <h4>Memory garden (private)</h4>
              <div className="memory-form">
                <label className="memory-field">
                  Memory title
                  <input value={memoryTitle} onChange={(event) => setMemoryTitle(event.target.value.slice(0, 60))} placeholder="A person, pet, or memory" />
                </label>
                <label className="memory-field">
                  Private note
                  <textarea value={memoryNote} onChange={(event) => setMemoryNote(event.target.value.slice(0, 400))} placeholder="A private note to keep with this memory..." rows={2} />
                </label>
                <label className="memory-field">
                  Associate with
                  <select value={memoryPlot} onChange={(event) => setMemoryPlot(event.target.value)}>
                    <option value="">The whole garden</option>
                    {state.garden.plots.map((plot, index) => (
                      <option key={plot.id} value={plot.id}>
                        Pot {index + 1} {plot.seed ? `(${plot.seed})` : '(empty)'}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="garden-action"
                  onClick={() => {
                    if (memoryTitle.trim() && memoryNote.trim() && onAddMemory) {
                      onAddMemory(memoryTitle.trim(), memoryNote.trim(), memoryPlot || null);
                      setMemoryTitle('');
                      setMemoryNote('');
                      setMemoryPlot('');
                    }
                  }}
                >
                  <BookHeart size={14} /> Keep privately
                </button>
              </div>
              <p className="garden-rest-note">Memories stay on this device. Edit or remove them anytime.</p>
              <div className="memory-list">
                {(state.garden.memories ?? []).slice(-4).map((memory) => (
                  <article key={memory.id} className="memory-item">
                    <h5>{memory.title}</h5>
                    <p>{memory.note}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="garden-section" aria-labelledby="garden-expand-title">
          <div className="section-heading">
            <span className="section-icon" aria-hidden="true">
              <Leaf size={18} strokeWidth={1.5} />
            </span>
            <div>
              <h3 id="garden-expand-title">Greenhouse, pond & cat corner</h3>
              <p>Grow a larger garden with more places to explore and rest.</p>
            </div>
          </div>
          <div className="garden-expand-grid">
            <div className="garden-expand-card">
              <h4>Glass Greenhouse</h4>
              <p>{state.garden.greenhouseUnlocked ? 'Unlocked — shelves, pots, and a potting nook await.' : 'Unlock by growing plants to bloom.'}</p>
              {!state.garden.greenhouseUnlocked && onUnlockGreenhouse && (
                <button type="button" className="garden-action" onClick={onUnlockGreenhouse}>
                  <Sparkles size={14} /> Unlock greenhouse
                </button>
              )}
            </div>
            <div className="garden-expand-card">
              <h4>Tiny Pond</h4>
              <p>{state.garden.pondUnlocked ? 'Unlocked — lily pads, ripples, and tiny fish reflect the stars.' : 'Unlock by growing different plants.'}</p>
              {!state.garden.pondUnlocked && onUnlockPond && (
                <button type="button" className="garden-action" onClick={onUnlockPond}>
                  <Droplets size={14} /> Unlock pond
                </button>
              )}
            </div>
            <div className="garden-expand-card">
              <h4>Cat&rsquo;s Secret Garden</h4>
              <p>Whisker can nap, chase butterflies, and bring tiny treasures to their corner.</p>
              <div className="cat-decor-row">
                {[
                  { id: 'cushion', label: 'Cushion' },
                  { id: 'scratching-post', label: 'Scratching post' },
                  { id: 'cat-plant', label: 'Cat-safe plant' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`cat-decor-pill ${state.garden.catItems?.includes(item.id as any) ? 'is-selected' : ''}`}
                    onClick={() => onDecorateCat?.(item.id as any)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
      {plantingPlot && (
        <div className="garden-plant-modal">
          <div className="garden-plant-panel">
            <div className="garden-plant-header">
              <div>
                <p className="garden-kicker">Grow What You Feel</p>
                <h4>Plant something for what is on your mind</h4>
              </div>
              <button type="button" className="panel-close" onClick={() => setPlantingPlot(null)} aria-label="Cancel planting">
                <X size={18} />
              </button>
            </div>
            <p className="garden-plant-intro">You do not have to write long entries. One sentence is enough. This stays on your device.</p>
            <label className="garden-plant-label">
              What are you carrying right now? (optional)
              <select value={plantFeeling} onChange={(event) => setPlantFeeling(event.target.value as FeelingId | '')}>
                <option value="">No label</option>
                {FEELINGS.map((feeling) => (
                  <option key={feeling.id} value={feeling.id}>
                    {feeling.label} — {feeling.blurb}
                  </option>
                ))}
              </select>
            </label>
            <label className="garden-plant-label">
              Private note (optional)
              <textarea value={plantNote} onChange={(event) => setPlantNote(event.target.value.slice(0, 500))} rows={4} placeholder="A memory, intention, or something you want to tend..." />
            </label>
            <div className="garden-plant-actions">
              <button type="button" className="garden-action" onClick={confirmPlant}>
                <Feather size={16} /> Plant this {SEED_OPTIONS.find((seed) => seed.id === plantSeedId)?.name.toLowerCase()}
              </button>
              <button type="button" className="garden-action garden-action-quiet" onClick={() => setPlantingPlot(null)}>
                Cancel
              </button>
            </div>
            <p className="garden-plant-footnote">Your garden becomes a visual diary. No streaks. You can edit or tend it anytime.</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
