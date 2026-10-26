import { CAT_REACTION_BY_ID, CAT_REACTIONS } from '../../data/catReactions';
import { CELESTIALS, CELESTIAL_BY_ID } from '../../data/collectibles';
import { CONSTELLATIONS, CONSTELLATION_BY_ID } from '../../data/constellations';
import { DECORATIONS } from '../../data/decorations';
import {
  GARDEN_DECORATIONS,
  GARDEN_PLANTS,
  GARDEN_SEED_IDS,
  GARDEN_VISITORS,
  plantDiscoveryId,
  visitorDiscoveryId,
} from '../../data/garden';
import { HIDDEN_BY_ID, HIDDEN_DISCOVERIES, SECRET_EVENTS } from '../../data/hidden';
import { DREAM_ISLANDS } from '../../data/islands';
import type {
  CelestialId,
  DecorationCategory,
  DecorationId,
  DiscoveryNotice,
  GardenDecorationId,
  GardenDecorationSlot,
  PlantId,
  Selections,
  WorldAction,
  WorldState,
} from '../../types/world';
import { DEFAULT_SELECTIONS, selectableDecoration } from '../../data/decorations';

export const SAVE_VERSION = 1;
export const TOTAL_DISCOVERIES =
  CELESTIALS.length +
  CONSTELLATIONS.length +
  HIDDEN_DISCOVERIES.length +
  CAT_REACTIONS.length +
  DREAM_ISLANDS.length +
  GARDEN_PLANTS.length +
  GARDEN_VISITORS.length +
  2;

const PLANT_IDS: readonly PlantId[] = ['fern', 'lavender', 'ivy'];
const CATEGORY_IDS: readonly DecorationCategory[] = ['planter', 'lantern', 'rug', 'trinket'];

export const CELESTIAL_IDS = new Set<string>(CELESTIALS.map((item) => item.id));
export const CONSTELLATION_IDS = new Set<string>(CONSTELLATIONS.map((item) => item.id));
export const HIDDEN_IDS = new Set<string>(HIDDEN_DISCOVERIES.map((item) => item.id));
export const CAT_REACTION_IDS = new Set<string>(CAT_REACTIONS.map((item) => item.id));
export const DECORATION_IDS = new Set<string>(DECORATIONS.map((item) => item.id));
export const PLANT_IDS_SET = new Set<string>(PLANT_IDS);
export const CATEGORY_IDS_SET = new Set<string>(CATEGORY_IDS);

function unique<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values : [...values, value];
}

const DEFAULT_GARDEN_PLOTS = [
  { id: 'plot-1', seed: null, stage: 0, watered: false, note: '', feeling: null, plantedAt: null },
  { id: 'plot-2', seed: null, stage: 0, watered: false, note: '', feeling: null, plantedAt: null },
  { id: 'plot-3', seed: null, stage: 0, watered: false, note: '', feeling: null, plantedAt: null },
  { id: 'plot-4', seed: null, stage: 0, watered: false, note: '', feeling: null, plantedAt: null },
] as const;

const DEFAULT_GARDEN_CREATURES = [
  { id: 'frog' as const, x: 0.18, y: 0.78, active: false, discovered: false, lastSeen: 0 },
  { id: 'butterfly' as const, x: 0.42, y: 0.62, active: false, discovered: false, lastSeen: 0 },
  { id: 'snail' as const, x: 0.76, y: 0.84, active: false, discovered: false, lastSeen: 0 },
  { id: 'firefly' as const, x: 0.58, y: 0.66, active: false, discovered: false, lastSeen: 0 },
];

const GARDEN_DECORATION_IDS = new Set<string>(GARDEN_DECORATIONS.map((item) => item.id));
const GARDEN_DECORATION_SLOTS: readonly GardenDecorationSlot[] = ['shelf', 'pondside', 'edge'];

export function createInitialState(now = Date.now()): WorldState {
  return {
    version: SAVE_VERSION,
    celestial: [],
    constellations: [],
    hidden: [],
    catReactions: [],
    islandsVisited: [],
    unlockedDecorations: [],
    selections: { ...DEFAULT_SELECTIONS },
    counters: {
      catPets: 0,
      firefliesCaught: 0,
      plantsTouched: [],
      moonClicked: false,
      lightsOffSeen: false,
      lightsToggled: 0,
      telescopeOpens: 0,
    },
    garden: {
      weather: 'clear',
      plots: DEFAULT_GARDEN_PLOTS.map((plot) => ({ ...plot })),
      discoveries: [],
      decorations: [],
      greenhouseUnlocked: false,
      pondUnlocked: false,
      creatures: DEFAULT_GARDEN_CREATURES.map((creature) => ({ ...creature })),
      creaturesDiscovered: [],
      season: 'night',
      memories: [],
      wishes: [],
      catCornerDecorated: false,
      catItems: [],
      sittingSpot: null,
      lastGrowthCheck: Date.now(),
    },
    lightsOn: true,
    lastVisit: now,
  };
}

export function reconcileProgress(state: WorldState): WorldState {
  const plantDiscoveries = state.garden.discoveries.filter((id) => id.startsWith('plant:'));
  const distinctPlants = new Set(plantDiscoveries);
  const greenhouseUnlocked =
    state.garden.greenhouseUnlocked || state.garden.plots.some((plot) => plot.seed && plot.stage >= 4);
  const pondUnlocked = state.garden.pondUnlocked || distinctPlants.size >= 2;
  const gardenDiscoveries = new Set(state.garden.discoveries);
  if (greenhouseUnlocked) gardenDiscoveries.add('greenhouse');
  if (pondUnlocked) gardenDiscoveries.add('pond');
  const creatures = (state.garden.creatures ?? DEFAULT_GARDEN_CREATURES).map((creature) => {
    const shouldActivate = Boolean(state.garden.plots.some((plot) => plot.seed && plot.stage >= 2));
    if (shouldActivate && !creature.discovered && creature.active) {
      return { ...creature, discovered: true };
    }
    return creature;
  });
  const creaturesDiscovered = [...new Set([...(state.garden.creaturesDiscovered ?? []), ...creatures.filter((c) => c.discovered).map((c) => c.id)])];
  const garden: WorldState['garden'] = {
    ...state.garden,
    creatures,
    creaturesDiscovered,
    greenhouseUnlocked,
    pondUnlocked,
    discoveries: [...gardenDiscoveries],
  };
  const celestial = new Set<CelestialId>(state.celestial);
  const hidden = new Set(state.hidden);
  for (const event of SECRET_EVENTS) {
    if (event.isTriggered(state)) hidden.add(event.reward);
  }
  if (state.counters.lightsOffSeen) celestial.add('quiet-star');
  if (state.counters.moonClicked) celestial.add('moonthread');
  if (state.constellations.length >= 1) celestial.add('comet-tear');
  if (state.counters.firefliesCaught >= 3) celestial.add('firefly-ember');
  if (PLANT_IDS.every((plant) => state.counters.plantsTouched.includes(plant))) {
    celestial.add('wishing-dust');
  }

  const unlocked = new Set<DecorationId>(state.unlockedDecorations);
  if (hidden.size >= 2) unlocked.add('night-bloom');
  if (state.constellations.length >= 2) unlocked.add('moonlit');
  if (hidden.size >= 4) unlocked.add('star-quilt');
  if (celestial.size >= CELESTIALS.length) unlocked.add('orrery');

  const selections: Selections = { ...state.selections };
  for (const category of CATEGORY_IDS) {
    const selected = selections[category];
    const withUnlocks: WorldState = {
      ...state,
      garden,
      celestial: [...celestial],
      unlockedDecorations: [...unlocked],
    };
    if (!selectableDecoration(category, selected, withUnlocks)) {
      const fallback = DEFAULT_SELECTIONS[category];
      selections[category] = fallback;
    }
  }

  return {
    ...state,
    garden,
    celestial: [...celestial],
    hidden: [...hidden],
    unlockedDecorations: [...unlocked],
    selections,
  };
}

export function applyWorldAction(state: WorldState, action: WorldAction): WorldState {
  let next: WorldState = {
    ...state,
    counters: { ...state.counters },
    garden: {
      weather: state.garden.weather,
      plots: state.garden.plots.map((plot) => ({ ...plot })),
      discoveries: [...state.garden.discoveries],
      decorations: state.garden.decorations.map((decoration) => ({ ...decoration })),
      greenhouseUnlocked: state.garden.greenhouseUnlocked,
      pondUnlocked: state.garden.pondUnlocked,
      creatures: (state.garden.creatures ?? DEFAULT_GARDEN_CREATURES).map((creature) => ({ ...creature })),
      creaturesDiscovered: [...(state.garden.creaturesDiscovered ?? [])],
      season: state.garden.season ?? 'night',
      memories: [...(state.garden.memories ?? [])],
      wishes: [...(state.garden.wishes ?? [])],
      catCornerDecorated: state.garden.catCornerDecorated ?? false,
      catItems: [...(state.garden.catItems ?? [])],
      sittingSpot: state.garden.sittingSpot ?? null,
      lastGrowthCheck: state.garden.lastGrowthCheck ?? Date.now(),
    },
  };

  switch (action.type) {
    case 'visit':
      next.lastVisit = Date.now();
      break;
    case 'pet-cat':
      next.counters.catPets = Math.min(state.counters.catPets + 1, 999);
      next.catReactions = unique(state.catReactions, action.reaction);
      break;
    case 'touch-plant':
      next.counters.plantsTouched = unique(state.counters.plantsTouched, action.plant);
      break;
    case 'plant-seed': {
      const plot = next.garden.plots.find((item) => item.id === action.plotId);
      if (!plot || plot.seed) break;
      if (!GARDEN_SEED_IDS.has(action.seed)) break;
      if (action.seed === 'celestial-flower' && state.constellations.length === 0) break;
      plot.seed = action.seed;
      plot.stage = 1;
      plot.watered = false;
      plot.note = action.note?.slice(0, 500) ?? '';
      plot.feeling = action.feeling ?? null;
      plot.plantedAt = Date.now();
      next.garden.discoveries = unique(next.garden.discoveries, plantDiscoveryId(action.seed));
      break;
    }
    case 'update-plot-note': {
      const plot = next.garden.plots.find((item) => item.id === action.plotId);
      if (!plot || !plot.seed) break;
      plot.note = action.note.slice(0, 500);
      plot.feeling = action.feeling ?? null;
      if (!plot.plantedAt) plot.plantedAt = Date.now();
      break;
    }
    case 'water-plot': {
      const plot = next.garden.plots.find((item) => item.id === action.plotId);
      if (!plot || !plot.seed) break;
      plot.watered = true;
      plot.stage = Math.min(plot.stage + 1, 4);
      break;
    }
    case 'remove-plant': {
      const plot = next.garden.plots.find((item) => item.id === action.plotId);
      if (!plot) break;
      plot.seed = null;
      plot.stage = 0;
      plot.watered = false;
      plot.note = '';
      plot.feeling = null;
      plot.plantedAt = null;
      break;
    }
    case 'discover-garden-visitor':
      if (GARDEN_VISITORS.some((visitor) => visitor.id === action.id)) {
        next.garden.discoveries = unique(next.garden.discoveries, visitorDiscoveryId(action.id));
      }
      break;
    case 'discover-garden-creature': {
      if (['frog', 'butterfly', 'snail', 'firefly'].includes(action.id)) {
        next.garden.creatures = (next.garden.creatures ?? DEFAULT_GARDEN_CREATURES).map((creature) =>
          creature.id === action.id ? { ...creature, discovered: true, active: true, lastSeen: Date.now() } : creature,
        );
        next.garden.creaturesDiscovered = unique(next.garden.creaturesDiscovered ?? [], action.id);
      }
      break;
    }
    case 'place-garden-decoration': {
      if (!state.garden.greenhouseUnlocked || !GARDEN_DECORATION_IDS.has(action.id)) break;
      if (!GARDEN_DECORATION_SLOTS.includes(action.slot)) break;
      next.garden.decorations = [
        ...next.garden.decorations.filter((decoration) => decoration.slot !== action.slot),
        { id: action.id as GardenDecorationId, slot: action.slot },
      ];
      break;
    }
    case 'remove-garden-decoration':
      next.garden.decorations = next.garden.decorations.filter(
        (decoration) => decoration.slot !== action.slot,
      );
      break;
    case 'set-garden-weather':
      next.garden.weather = action.weather;
      if (action.weather === 'rain' && state.garden.weather !== 'rain') {
        next.garden.plots = next.garden.plots.map((plot) =>
          plot.seed
            ? { ...plot, stage: Math.min(plot.stage + 1, 4), watered: true }
            : plot,
        );
      }
      if (action.weather === 'meteor-shower') {
        const celestialFlowerPlot = next.garden.plots.find((plot) => plot.seed === 'celestial-flower');
        if (celestialFlowerPlot) {
          celestialFlowerPlot.stage = Math.min(celestialFlowerPlot.stage + 1, 4);
        }
      }
      break;
    case 'set-garden-season':
      next.garden.season = action.season;
      break;
    case 'unlock-greenhouse':
      next.garden.greenhouseUnlocked = true;
      break;
    case 'unlock-pond':
      next.garden.pondUnlocked = true;
      break;
    case 'add-garden-memory': {
      const memory = action.memory;
      next.garden.memories = [...(next.garden.memories ?? []), memory].slice(-50);
      break;
    }
    case 'update-garden-memory': {
      const memory = action.memory;
      next.garden.memories = (next.garden.memories ?? []).map((item) => (item.id === memory.id ? memory : item));
      break;
    }
    case 'remove-garden-memory':
      next.garden.memories = (next.garden.memories ?? []).filter((item) => item.id !== action.id);
      break;
    case 'add-garden-wish': {
      const note = action.note.trim().slice(0, 200);
      if (!note) break;
      next.garden.wishes = [...(next.garden.wishes ?? []), { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, note, createdAt: Date.now() }].slice(-20);
      break;
    }
    case 'decorate-cat-corner': {
      if (!next.garden.catItems.includes(action.item)) {
        next.garden.catItems = [...next.garden.catItems, action.item];
        next.garden.catCornerDecorated = true;
      }
      break;
    }
    case 'sit-at-spot':
      next.garden.sittingSpot = action.spot;
      break;
    case 'garden-growth-tick': {
      const now = Date.now();
      if (now - (next.garden.lastGrowthCheck ?? 0) > 3600000) {
        next.garden.plots = next.garden.plots.map((plot) => {
          if (!plot.seed || plot.stage >= 4) return plot;
          if (plot.watered) {
            return { ...plot, stage: Math.min(plot.stage + 1, 4), watered: false };
          }
          if (next.garden.weather === 'rain') {
            return { ...plot, stage: Math.min(plot.stage + 1, 4), watered: true };
          }
          return plot;
        });
        next.garden.lastGrowthCheck = now;
      }
      const bloomingCount = next.garden.plots.filter((plot) => plot.seed && plot.stage >= 3).length;
      if (bloomingCount >= 2) {
        next.garden.creatures = (next.garden.creatures ?? DEFAULT_GARDEN_CREATURES).map((creature) =>
          creature.active || creature.discovered ? creature : { ...creature, active: true },
        );
      }
      break;
    }
    case 'catch-firefly':
      next.counters.firefliesCaught = Math.min(state.counters.firefliesCaught + 1, 99);
      break;
    case 'click-moon':
      next.counters.moonClicked = true;
      break;
    case 'find-hidden':
      next.hidden = unique(state.hidden, action.id);
      break;
    case 'discover-constellation':
      next.constellations = unique(state.constellations, action.id);
      break;
    case 'discover-celestial':
      next.celestial = unique(state.celestial, action.id);
      break;
    case 'visit-island':
      next.islandsVisited = unique(state.islandsVisited, action.id);
      break;
    case 'toggle-lights':
      next.lightsOn = !state.lightsOn;
      next.counters.lightsToggled = Math.min(state.counters.lightsToggled + 1, 999);
      if (!next.lightsOn) next.counters.lightsOffSeen = true;
      break;
    case 'select-decoration': {
      if (selectableDecoration(action.category, action.id, state)) {
        next.selections = { ...state.selections, [action.category]: action.id };
      }
      break;
    }
    case 'opened-telescope':
      next.counters.telescopeOpens = Math.min(state.counters.telescopeOpens + 1, 999);
      break;
    case 'reset':
      return createInitialState();
    default:
      return state;
  }

  return reconcileProgress(next);
}

export function totalDiscoveries(state: WorldState): number {
  return (
    state.celestial.length +
    state.constellations.length +
    state.hidden.length +
    state.catReactions.length +
    state.islandsVisited.length +
    state.garden.discoveries.length +
    (state.garden.creaturesDiscovered?.length ?? 0)
  );
}

export function detectNewNotices(previous: WorldState, next: WorldState): DiscoveryNotice[] {
  const notices: DiscoveryNotice[] = [];
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  for (const id of next.hidden) {
    if (!previous.hidden.includes(id)) {
      const item = HIDDEN_BY_ID.get(id);
      if (!item) continue;
      notices.push({
        id: `${stamp}-${id}`,
        kind: 'hidden',
        title: 'A rooftop secret',
        subtitle: item.name,
        body: item.description,
      });
    }
  }

  for (const id of next.constellations) {
    if (!previous.constellations.includes(id)) {
      const item = CONSTELLATION_BY_ID.get(id);
      if (!item) continue;
      notices.push({
        id: `${stamp}-${id}`,
        kind: 'constellation',
        title: 'A constellation found',
        subtitle: item.name,
        body: item.whisper,
      });
    }
  }

  for (const id of next.celestial) {
    if (!previous.celestial.includes(id)) {
      const item = CELESTIAL_BY_ID.get(id);
      if (!item) continue;
      notices.push({
        id: `${stamp}-${id}`,
        kind: 'celestial',
        title: 'A sky keepsake',
        subtitle: item.name,
        body: item.description,
      });
    }
  }

  for (const id of next.catReactions) {
    if (!previous.catReactions.includes(id)) {
      const item = CAT_REACTION_BY_ID.get(id);
      if (!item) continue;
      notices.push({
        id: `${stamp}-${id}`,
        kind: 'cat-reaction',
        title: "Whisker's mood",
        subtitle: item.name,
        body: item.description,
      });
    }
  }

  for (const id of next.islandsVisited) {
    if (previous.islandsVisited.includes(id)) continue;
    const island = DREAM_ISLANDS.find((item) => item.id === id);
    if (!island) continue;
    notices.push({
      id: `${stamp}-${id}`,
      kind: 'island',
      title: 'A little world visited',
      subtitle: island.name,
      body: island.description,
    });
  }

  for (const id of next.garden.discoveries) {
    if (previous.garden.discoveries.includes(id)) continue;
    const [kind, value] = id.split(':');
    const item =
      kind === 'plant'
        ? GARDEN_PLANTS.find((plant) => plant.id === value)
        : kind === 'visitor'
          ? GARDEN_VISITORS.find((visitor) => visitor.id === value)
          : id === 'greenhouse'
            ? { name: 'The Little Greenhouse', description: 'A glass-roofed nook is ready to shelter the growing things.' }
            : id === 'pond'
              ? { name: 'The Rooftop Pond', description: 'A little pool has appeared, with a lily pad resting at its edge.' }
              : undefined;
    if (!item) continue;
    notices.push({
      id: `${stamp}-${id}`,
      kind: 'garden',
      title: kind === 'visitor' ? 'A garden visitor' : 'The garden is growing',
      subtitle: item.name,
      body: item.description,
    });
  }

  for (const id of next.unlockedDecorations) {
    if (!previous.unlockedDecorations.includes(id)) {
      const item = DECORATIONS.find((decoration) => decoration.id === id);
      if (!item) continue;
      notices.push({
        id: `${stamp}-${id}`,
        kind: 'unlock',
        title: 'Something new for the rooftop',
        subtitle: item.name,
        body: item.description,
      });
    }
  }

  return notices;
}
