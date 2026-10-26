export type CelestialId =
  | 'quiet-star'
  | 'moonthread'
  | 'comet-tear'
  | 'firefly-ember'
  | 'wishing-dust'
  | 'starglass';

export type ConstellationId = 'sleeping-fox' | 'paper-crane' | 'lantern-keeper';
export type IslandId =
  | 'moon-garden'
  | 'cloud-cottage'
  | 'little-observatory'
  | 'island-of-grief'
  | 'island-of-change'
  | 'island-of-belonging'
  | 'island-of-rest'
  | 'island-of-hope';

export type HiddenId =
  | 'paper-boat'
  | 'brass-key'
  | 'moon-feather'
  | 'jam-jar'
  | 'chalk-star'
  | 'lantern-note'
  | 'whisker-charm'
  | 'moon-seed';

export type CatReactionId = 'purr' | 'slow-blink' | 'stretch' | 'yawn' | 'tail-curl';

export type PlantId = 'fern' | 'lavender' | 'ivy';
export type GardenSeed =
  | PlantId
  | 'moonflower'
  | 'star-succulent'
  | 'glowing-mushrooms'
  | 'celestial-flower';

export interface GardenCreature {
  id: GardenCreatureId;
  x: number;
  y: number;
  active: boolean;
  discovered: boolean;
  lastSeen: number;
}
export type GardenWeather = 'clear' | 'breeze' | 'mist' | 'rain' | 'meteor-shower';
export type FeelingId =
  | 'heavy'
  | 'tender'
  | 'restless'
  | 'lonely'
  | 'hopeful'
  | 'grateful'
  | 'angry'
  | 'calm'
  | 'numb'
  | 'missing-someone';

export type GardenCreatureId = 'frog' | 'butterfly' | 'snail' | 'firefly';
export type GardenSeason = 'night' | 'mist' | 'bloom';

export type GardenSitSpotId = 'bench' | 'swing' | 'blanket' | 'tea-table';
export type GardenVisitorId = 'frog' | 'butterfly' | 'snail' | 'fireflies';
export type GardenDiscoveryId =
  | `plant:${GardenSeed}`
  | `visitor:${GardenVisitorId}`
  | 'greenhouse'
  | 'pond';
export type GardenDecorationId =
  | 'hanging-planter'
  | 'terracotta-pot'
  | 'watering-can'
  | 'wooden-shelf'
  | 'garden-lantern'
  | 'garden-bench'
  | 'flower-swing';
export type GardenDecorationSlot = 'shelf' | 'pondside' | 'edge';

export interface GardenDecorationPlacement {
  id: GardenDecorationId;
  slot: GardenDecorationSlot;
}

export interface GardenPlot {
  id: string;
  seed: GardenSeed | null;
  stage: number;
  watered: boolean;
  note: string;
  feeling?: FeelingId | null;
  plantedAt?: number | null;
}

export interface GardenMemory {
  id: string;
  plotId?: string | null;
  decorationSlot?: GardenDecorationSlot | null;
  title: string;
  note: string;
  createdAt: number;
  updatedAt: number;
  private: boolean;
}

export interface GardenState {
  weather: GardenWeather;
  plots: GardenPlot[];
  discoveries: GardenDiscoveryId[];
  decorations: GardenDecorationPlacement[];
  greenhouseUnlocked: boolean;
  pondUnlocked: boolean;
  creatures: GardenCreature[];
  creaturesDiscovered: GardenCreatureId[];
  season: GardenSeason;
  memories: GardenMemory[];
  wishes: Array<{ id: string; note: string; createdAt: number }>;
  catCornerDecorated: boolean;
  catItems: Array<'cushion' | 'scratching-post' | 'cat-plant'>;
  sittingSpot: GardenSitSpotId | null;
  lastGrowthCheck: number;
}

export type DecorationCategory = 'planter' | 'lantern' | 'rug' | 'trinket';

export type DecorationId =
  | 'fern'
  | 'lavender'
  | 'night-bloom'
  | 'amber-glow'
  | 'moonlit'
  | 'woven-rug'
  | 'star-quilt'
  | 'teacup'
  | 'orrery';

export type Selections = Record<DecorationCategory, DecorationId>;

export interface ProgressCounters {
  catPets: number;
  firefliesCaught: number;
  plantsTouched: PlantId[];
  moonClicked: boolean;
  lightsOffSeen: boolean;
  lightsToggled: number;
  telescopeOpens: number;
}

export interface WorldState {
  version: number;
  celestial: CelestialId[];
  constellations: ConstellationId[];
  hidden: HiddenId[];
  catReactions: CatReactionId[];
  islandsVisited: IslandId[];
  unlockedDecorations: DecorationId[];
  selections: Selections;
  counters: ProgressCounters;
  garden: GardenState;
  lightsOn: boolean;
  lastVisit: number;
}

export type WorldAction =
  | { type: 'visit' }
  | { type: 'pet-cat'; reaction: CatReactionId }
  | { type: 'touch-plant'; plant: PlantId }
  | { type: 'plant-seed'; plotId: string; seed: GardenSeed; note?: string; feeling?: FeelingId }
  | { type: 'update-plot-note'; plotId: string; note: string; feeling?: FeelingId | null }
  | { type: 'water-plot'; plotId: string }
  | { type: 'remove-plant'; plotId: string }
  | { type: 'discover-garden-visitor'; id: GardenVisitorId }
  | { type: 'discover-garden-creature'; id: GardenCreatureId }
  | { type: 'place-garden-decoration'; id: GardenDecorationId; slot: GardenDecorationSlot }
  | { type: 'remove-garden-decoration'; slot: GardenDecorationSlot }
  | { type: 'set-garden-weather'; weather: GardenWeather }
  | { type: 'set-garden-season'; season: GardenSeason }
  | { type: 'unlock-greenhouse' }
  | { type: 'unlock-pond' }
  | { type: 'add-garden-memory'; memory: GardenMemory }
  | { type: 'update-garden-memory'; memory: GardenMemory }
  | { type: 'remove-garden-memory'; id: string }
  | { type: 'add-garden-wish'; note: string }
  | { type: 'decorate-cat-corner'; item: 'cushion' | 'scratching-post' | 'cat-plant' }
  | { type: 'sit-at-spot'; spot: GardenSitSpotId | null }
  | { type: 'garden-growth-tick' }
  | { type: 'catch-firefly' }
  | { type: 'click-moon' }
  | { type: 'find-hidden'; id: HiddenId }
  | { type: 'discover-constellation'; id: ConstellationId }
  | { type: 'discover-celestial'; id: CelestialId }
  | { type: 'visit-island'; id: IslandId }
  | { type: 'toggle-lights' }
  | { type: 'select-decoration'; category: DecorationCategory; id: DecorationId }
  | { type: 'opened-telescope' }
  | { type: 'reset' };

export interface SceneState {
  hidden: HiddenId[];
  lightsOn: boolean;
  selections: Selections;
  celestial: CelestialId[];
  constellations: ConstellationId[];
}

export interface DiscoveryNotice {
  id: string;
  kind:
    | 'celestial'
    | 'constellation'
    | 'hidden'
    | 'cat-reaction'
    | 'unlock'
    | 'whisper'
    | 'island'
    | 'garden';
  title: string;
  subtitle: string;
  body: string;
}
