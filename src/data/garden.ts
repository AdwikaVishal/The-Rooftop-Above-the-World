import type {
  GardenCreatureId,
  GardenDecorationId,
  GardenDecorationSlot,
  GardenDiscoveryId,
  GardenSeed,
  GardenSitSpotId,
  GardenVisitorId,
} from '../types/world';

export interface GardenPlantDefinition {
  id: GardenSeed;
  name: string;
  description: string;
  condition: string;
  color: string;
  accent: string;
  unlockHint?: string;
  preferredWeather?: string;
  preferredTime?: 'night' | 'day' | 'any';
  stages?: number;
}

export const GARDEN_PLANTS: readonly GardenPlantDefinition[] = [
  {
    id: 'lavender',
    name: 'Moon Lavender',
    description: 'Soft violet sprigs lean toward the quietest patch of sky.',
    condition: 'Likes a little water and a gentle breeze.',
    color: '#a99ad0',
    accent: '#e3c9eb',
  },
  {
    id: 'moonflower',
    name: 'Moonflower',
    description: 'Pale petals unfurl when the rooftop lamps grow low.',
    condition: 'Thrives in moonlight and rain.',
    color: '#e9dce2',
    accent: '#f5ebdd',
    preferredTime: 'night',
    preferredWeather: 'mist',
  },
  {
    id: 'star-succulent',
    name: 'Star Succulent',
    description: 'A patient little rosette keeps a fleck of starlight at its heart.',
    condition: 'Prefers dry soil and a clear night.',
    color: '#8fae9b',
    accent: '#d0d98e',
    preferredTime: 'night',
    preferredWeather: 'clear',
  },
  {
    id: 'glowing-mushrooms',
    name: 'Glowcap Mushrooms',
    description: 'A cluster of tiny caps glimmers like lanterns beneath the leaves.',
    condition: 'Loves mist and softly damp soil.',
    color: '#d78caa',
    accent: '#ffd29c',
    preferredWeather: 'mist',
  },
  {
    id: 'celestial-flower',
    name: 'Celestial Flower',
    description: 'A rare bloom opens where a constellation has been named.',
    condition: 'Grows best beneath a sky visitors have taken time to know.',
    color: '#e8c775',
    accent: '#fff2bd',
    unlockHint: 'Discover any constellation to find its seed.',
    preferredTime: 'night',
    preferredWeather: 'clear',
  },
  {
    id: 'fern',
    name: 'Rooftop Fern',
    description: 'A familiar fern unfurls its fronds one patient watering at a time.',
    condition: 'Likes shade and an occasional drink.',
    color: '#7f9b83',
    accent: '#b7cda2',
  },
  {
    id: 'ivy',
    name: 'Night Ivy',
    description: 'Small sage leaves reach gently over the edge of the pot.',
    condition: 'Enjoys a light breeze.',
    color: '#6f8a76',
    accent: '#b1c79e',
  },
];

export const GARDEN_PLANT_BY_ID = new Map(GARDEN_PLANTS.map((plant) => [plant.id, plant]));
export const GARDEN_SEED_IDS = new Set<string>(GARDEN_PLANTS.map((plant) => plant.id));

export const GARDEN_GROWTH_STAGES = [
  'A seed tucked into the soil',
  'A small green sprout',
  'Leaves beginning to unfurl',
  'A young plant finding its shape',
  'In full bloom',
] as const;

export interface GardenVisitorDefinition {
  id: GardenVisitorId;
  name: string;
  description: string;
}

export const GARDEN_VISITORS: readonly GardenVisitorDefinition[] = [
  { id: 'frog', name: 'The Moss-Backed Frog', description: 'A little frog rests beneath the broadest leaf.' },
  { id: 'butterfly', name: 'The Evening Butterfly', description: 'A dusty-pink butterfly pauses where flowers open.' },
  { id: 'snail', name: 'The Slow Little Snail', description: 'A snail takes the long way around the garden edge.' },
  { id: 'fireflies', name: 'The Firefly Gathering', description: 'A few fireflies gather near the plants that glow.' },
];

export const GARDEN_VISITOR_BY_ID = new Map(GARDEN_VISITORS.map((visitor) => [visitor.id, visitor]));

export interface GardenCreatureDefinition {
  id: GardenCreatureId;
  name: string;
  description: string;
  behavior: string;
}

export const GARDEN_CREATURES: readonly GardenCreatureDefinition[] = [
  { id: 'frog', name: 'Moss-Backed Frog', description: 'Naps beneath a leafy pot, perfectly content.', behavior: 'Rests in the shade, blinks slowly.' },
  { id: 'butterfly', name: 'Evening Butterfly', description: 'Dusty-pink wings drift between blooming flowers.', behavior: 'Visits when moonflowers or lavender bloom.' },
  { id: 'snail', name: 'Glow-Shell Snail', description: 'Takes the long way around with a tiny glowing shell.', behavior: 'Slowly wanders the garden edge.' },
  { id: 'firefly', name: 'Rooftop Fireflies', description: 'Tiny lights follow the cat or gather around glowcaps.', behavior: 'Gather around glowing plants at dusk.' },
];

export const GARDEN_CREATURE_BY_ID = new Map(GARDEN_CREATURES.map((creature) => [creature.id, creature]));

export interface GardenSitSpotDefinition {
  id: GardenSitSpotId;
  name: string;
  description: string;
}

export const GARDEN_SIT_SPOTS: readonly GardenSitSpotDefinition[] = [
  { id: 'bench', name: 'Garden Bench', description: 'A quiet seat facing the moon.' },
  { id: 'swing', name: 'Flower Swing', description: 'A tiny swing beneath flowering vines.' },
  { id: 'blanket', name: 'Blanket in the grass', description: 'A soft spot to sit and watch the stars.' },
  { id: 'tea-table', name: 'Tiny Tea Table', description: 'A cozy spot for a quiet moment.' },
];

export const GARDEN_SIT_SPOT_BY_ID = new Map(GARDEN_SIT_SPOTS.map((spot) => [spot.id, spot]));

export const GARDEN_DECORATIONS: readonly {
  id: GardenDecorationId;
  name: string;
  description: string;
  slot: GardenDecorationSlot;
}[] = [
  { id: 'hanging-planter', name: 'Hanging Planter', description: 'A little basket of leaves for the garden shelf.', slot: 'shelf' },
  { id: 'terracotta-pot', name: 'Terracotta Pot', description: 'A spare pot, ready for another growing thing.', slot: 'edge' },
  { id: 'watering-can', name: 'Tiny Watering Can', description: 'A small brass can for unhurried watering.', slot: 'shelf' },
  { id: 'wooden-shelf', name: 'Wooden Plant Shelf', description: 'A warm little shelf for seedlings and keepsakes.', slot: 'shelf' },
  { id: 'garden-lantern', name: 'Garden Lantern', description: 'A low amber light beside the leaves.', slot: 'pondside' },
  { id: 'garden-bench', name: 'Garden Bench', description: 'A quiet seat facing the night sky.', slot: 'pondside' },
  { id: 'flower-swing', name: 'Flower Swing', description: 'A tiny swing beneath a flowering vine.', slot: 'edge' },
];

export interface GardenSeedCard {
  id: GardenSeed;
  story: string;
  hints: string[];
}

export const GARDEN_SEED_CARDS: readonly GardenSeedCard[] = [
  { id: 'lavender', story: 'A sprig pressed between pages, still fragrant after all these years.', hints: ['Likes a gentle breeze'] },
  { id: 'moonflower', story: 'Opens for those who notice the quietest part of the night.', hints: ['Opens after dark'] },
  { id: 'star-succulent', story: 'Keeps a fleck of starlight for a cloudy evening.', hints: ['Patient and hardy'] },
  { id: 'glowing-mushrooms', story: 'Mushrooms that remember the way home by lamplight.', hints: ['Loves the mist'] },
  { id: 'celestial-flower', story: 'Grows where constellations are named with care.', hints: ['Rare, found through discovery'] },
  { id: 'fern', story: 'An old friend that asks for very little.', hints: ['Steady and familiar'] },
  { id: 'ivy', story: 'Reaches slowly toward the edge to watch the city lights.', hints: ['Trails gently over the pot'] },
];

export const GARDEN_SEED_CARD_BY_ID = new Map(GARDEN_SEED_CARDS.map((card) => [card.id, card]));

export const GARDEN_DISCOVERY_IDS = new Set<string>([
  ...GARDEN_PLANTS.map((plant) => `plant:${plant.id}`),
  ...GARDEN_VISITORS.map((visitor) => `visitor:${visitor.id}`),
  'greenhouse',
  'pond',
]);

export function plantDiscoveryId(seed: GardenSeed): GardenDiscoveryId {
  return `plant:${seed}`;
}

export function visitorDiscoveryId(visitor: GardenVisitorId): GardenDiscoveryId {
  return `visitor:${visitor}`;
}
