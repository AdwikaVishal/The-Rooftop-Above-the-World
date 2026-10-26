import {
  CAT_REACTION_IDS,
  CELESTIAL_IDS,
  CONSTELLATION_IDS,
  DECORATION_IDS,
  HIDDEN_IDS,
  PLANT_IDS_SET,
  SAVE_VERSION,
  createInitialState,
  reconcileProgress,
} from '../game/systems/DiscoverySystem';
import { DECORATIONS } from '../data/decorations';
import { DREAM_ISLANDS } from '../data/islands';
import { FEELING_IDS } from '../data/feelings';
import type {
  CatReactionId,
  CelestialId,
  ConstellationId,
  DecorationCategory,
  DecorationId,
  FeelingId,
  GardenCreatureId,
  GardenSeed,
  GardenSitSpotId,
  GardenState,
  GardenWeather,
  HiddenId,
  IslandId,
  PlantId,
  Selections,
  WorldState,
} from '../types/world';
import { DEFAULT_SELECTIONS, isDecorationUnlocked } from '../data/decorations';

const STORAGE_KEY = 'rooftop-above-the-world:save';
const CORRUPT_BACKUP_KEY = 'rooftop-above-the-world:save-corrupt-backup';

const DECORATION_CATEGORY_BY_ID = new Map<DecorationId, DecorationCategory>(
  DECORATIONS.map((item) => [item.id, item.category]),
);
const ISLAND_IDS = new Set<string>(DREAM_ISLANDS.map((island) => island.id));

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readStringArray<T extends string>(
  value: unknown,
  allowed: ReadonlySet<string>,
): T[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result: T[] = [];
  for (const entry of value) {
    if (typeof entry === 'string' && allowed.has(entry) && !result.includes(entry as T)) {
      result.push(entry as T);
    }
  }
  return result;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function readCount(value: unknown, fallback = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(999, Math.floor(value)));
}

function readSelections(value: unknown, base: WorldState): Selections {
  const selections: Selections = { ...DEFAULT_SELECTIONS };
  if (!isRecord(value)) return selections;

  const categories: readonly DecorationCategory[] = ['planter', 'lantern', 'rug', 'trinket'];
  for (const category of categories) {
    const raw = value[category];
    if (typeof raw !== 'string' || !DECORATION_IDS.has(raw)) continue;
    const id = raw as DecorationId;
    if (DECORATION_CATEGORY_BY_ID.get(id) !== category) continue;
    if (!isDecorationUnlocked(id, base)) continue;
    selections[category] = id;
  }
  return selections;
}

function readGardenState(value: unknown): GardenState {
  const fallback: GardenState = {
    weather: 'clear',
    plots: [
      { id: 'plot-1', seed: null, stage: 0, watered: false, note: '', feeling: null, plantedAt: null },
      { id: 'plot-2', seed: null, stage: 0, watered: false, note: '', feeling: null, plantedAt: null },
      { id: 'plot-3', seed: null, stage: 0, watered: false, note: '', feeling: null, plantedAt: null },
      { id: 'plot-4', seed: null, stage: 0, watered: false, note: '', feeling: null, plantedAt: null },
    ],
    discoveries: [],
    decorations: [],
    greenhouseUnlocked: false,
    pondUnlocked: false,
    creatures: [
      { id: 'frog', x: 0.18, y: 0.78, active: false, discovered: false, lastSeen: 0 },
      { id: 'butterfly', x: 0.42, y: 0.62, active: false, discovered: false, lastSeen: 0 },
      { id: 'snail', x: 0.76, y: 0.84, active: false, discovered: false, lastSeen: 0 },
      { id: 'firefly', x: 0.58, y: 0.66, active: false, discovered: false, lastSeen: 0 },
    ],
    creaturesDiscovered: [],
    season: 'night',
    memories: [],
    wishes: [],
    catCornerDecorated: false,
    catItems: [],
    sittingSpot: null,
    lastGrowthCheck: Date.now(),
  };

  if (!isRecord(value)) return fallback;
  const weather = value.weather;
  const allowedWeather = new Set<GardenWeather>(['clear', 'breeze', 'mist', 'rain', 'meteor-shower']);
  const plots = Array.isArray(value.plots) ? value.plots : [];

  const normalizedPlots = plots
    .map((entry, index) => {
      if (!isRecord(entry)) return null;
      const seedValue = entry.seed;
      const seed =
        typeof seedValue === 'string' &&
        (seedValue === 'fern' ||
          seedValue === 'lavender' ||
          seedValue === 'ivy' ||
          seedValue === 'moonflower')
          ? (seedValue as GardenSeed)
          : null;
      const stage =
        typeof entry.stage === 'number' && Number.isFinite(entry.stage)
          ? Math.max(0, Math.min(4, Math.floor(entry.stage)))
          : 0;
      const watered = typeof entry.watered === 'boolean' ? entry.watered : false;
      const note = typeof entry.note === 'string' ? entry.note : '';
      const rawFeeling = entry.feeling;
      const feeling =
        typeof rawFeeling === 'string' && FEELING_IDS.has(rawFeeling)
          ? (rawFeeling as FeelingId)
          : null;
      const plantedAt =
        typeof entry.plantedAt === 'number' && Number.isFinite(entry.plantedAt)
          ? entry.plantedAt
          : null;
      return {
        id: typeof entry.id === 'string' ? entry.id : `plot-${index + 1}`,
        seed,
        stage,
        watered,
        note,
        feeling,
        plantedAt,
      };
    })
    .filter((plot): plot is NonNullable<typeof plot> => plot !== null);

  const nextPlots = fallback.plots.map((plot) => {
    const match = normalizedPlots.find((entry) => entry.id === plot.id);
    return match ?? { ...plot };
  });

  const weatherValue =
    typeof weather === 'string' && allowedWeather.has(weather as GardenWeather)
      ? (weather as GardenWeather)
      : fallback.weather;

  const discoveries = Array.isArray(value.discoveries)
    ? value.discoveries.filter((entry): entry is string => typeof entry === 'string')
    : [];
  const decorations = Array.isArray(value.decorations)
    ? value.decorations
        .filter((entry): entry is Record<string, unknown> => isRecord(entry))
        .map((entry) => ({
          id: typeof entry.id === 'string' ? entry.id : 'hanging-planter',
          slot: typeof entry.slot === 'string' ? entry.slot : 'edge',
        }))
    : [];

  const creaturesRaw = Array.isArray((value as Record<string, unknown>).creatures)
    ? ((value as Record<string, unknown>).creatures as unknown[])
    : [];
  const creatures = creaturesRaw
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const id = entry.id;
      if (id !== 'frog' && id !== 'butterfly' && id !== 'snail' && id !== 'firefly') return null;
      return {
        id: id as GardenCreatureId,
        x: typeof entry.x === 'number' ? entry.x : 0.5,
        y: typeof entry.y === 'number' ? entry.y : 0.7,
        active: readBoolean(entry.active, false),
        discovered: readBoolean(entry.discovered, false),
        lastSeen: typeof entry.lastSeen === 'number' ? entry.lastSeen : 0,
      };
    })
    .filter((creature): creature is NonNullable<typeof creature> => creature !== null);
  const creaturesFinal = creatures.length === 4 ? creatures : fallback.creatures;
  const creaturesDiscoveredRaw = readStringArray(
    (value as Record<string, unknown>).creaturesDiscovered,
    new Set(['frog', 'butterfly', 'snail', 'firefly']),
  );
  const seasonValue = (value as Record<string, unknown>).season;
  const season =
    seasonValue === 'night' || seasonValue === 'mist' || seasonValue === 'bloom'
      ? seasonValue
      : 'night';
  const sittingSpotValue = (value as Record<string, unknown>).sittingSpot;
  const sittingSpot =
    sittingSpotValue === 'bench' || sittingSpotValue === 'swing' || sittingSpotValue === 'blanket' || sittingSpotValue === 'tea-table'
      ? (sittingSpotValue as GardenSitSpotId)
      : null;

  return {
    weather: weatherValue,
    plots: nextPlots,
    discoveries: discoveries as GardenState['discoveries'],
    decorations: decorations as GardenState['decorations'],
    greenhouseUnlocked: readBoolean(value.greenhouseUnlocked, false),
    pondUnlocked: readBoolean(value.pondUnlocked, false),
    creatures: creaturesFinal,
    creaturesDiscovered: (creaturesDiscoveredRaw as GardenCreatureId[]) ?? [],
    season: season as GardenState['season'],
    memories: Array.isArray((value as Record<string, unknown>).memories)
      ? ((value as Record<string, unknown>).memories as GardenState['memories'])
      : [],
    wishes: Array.isArray((value as Record<string, unknown>).wishes)
      ? ((value as Record<string, unknown>).wishes as GardenState['wishes'])
      : [],
    catCornerDecorated: readBoolean((value as Record<string, unknown>).catCornerDecorated, false),
    catItems: Array.isArray((value as Record<string, unknown>).catItems)
      ? ((value as Record<string, unknown>).catItems as GardenState['catItems'])
      : [],
    sittingSpot,
    lastGrowthCheck:
      typeof (value as Record<string, unknown>).lastGrowthCheck === 'number'
        ? ((value as Record<string, unknown>).lastGrowthCheck as number)
        : Date.now(),
  };
}

export function validateWorldState(value: unknown): WorldState | null {
  if (!isRecord(value)) return null;
  if (value.version !== SAVE_VERSION) return null;

  const base = createInitialState();
  const countersRaw = isRecord(value.counters) ? value.counters : {};

  const celestial = readStringArray<CelestialId>(value.celestial, CELESTIAL_IDS) ?? [];
  const constellations =
    readStringArray<ConstellationId>(value.constellations, CONSTELLATION_IDS) ?? [];
  const hidden = readStringArray<HiddenId>(value.hidden, HIDDEN_IDS) ?? [];
  const catReactions =
    readStringArray<CatReactionId>(value.catReactions, CAT_REACTION_IDS) ?? [];
  const islandsVisited =
    readStringArray<IslandId>(value.islandsVisited, ISLAND_IDS) ?? [];
  const unlockedDecorations =
    readStringArray<DecorationId>(value.unlockedDecorations, DECORATION_IDS) ?? [];

  const plantsTouchedRaw = readStringArray<PlantId>(
    countersRaw.plantsTouched,
    PLANT_IDS_SET,
  );
  const plantsTouched = plantsTouchedRaw ?? [];

  const candidate: WorldState = {
    version: SAVE_VERSION,
    celestial,
    constellations,
    hidden,
    catReactions,
    islandsVisited,
    unlockedDecorations,
    selections: { ...DEFAULT_SELECTIONS },
    counters: {
      catPets: readCount(countersRaw.catPets),
      firefliesCaught: readCount(countersRaw.firefliesCaught),
      plantsTouched,
      moonClicked: readBoolean(countersRaw.moonClicked, false),
      lightsOffSeen: readBoolean(countersRaw.lightsOffSeen, false),
      lightsToggled: readCount(countersRaw.lightsToggled),
      telescopeOpens: readCount(countersRaw.telescopeOpens),
    },
    garden: readGardenState(value.garden),
    lightsOn: readBoolean(value.lightsOn, true),
    lastVisit:
      typeof value.lastVisit === 'number' && Number.isFinite(value.lastVisit)
        ? value.lastVisit
        : base.lastVisit,
  };

  candidate.selections = readSelections(value.selections, candidate);
  return reconcileProgress(candidate);
}

function backupCorruptSave(raw: string): void {
  try {
    window.localStorage.setItem(CORRUPT_BACKUP_KEY, raw);
  } catch {
    // A full or unavailable storage should never stop the rooftop from opening.
  }
}

export function loadWorldState(): WorldState | null {
  if (typeof window === 'undefined') return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const validated = validateWorldState(parsed);
    if (!validated) backupCorruptSave(raw);
    return validated;
  } catch (error) {
    if (raw) backupCorruptSave(raw);
    console.warn('The rooftop could not read its old memories. Starting fresh.', error);
    return null;
  }
}

export function saveWorldState(state: WorldState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('The rooftop could not save its memories right now.', error);
  }
}

export function clearWorldState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures; the in-memory world still resets.
  }
}
