import type {
  DecorationCategory,
  DecorationId,
  Selections,
  WorldState,
} from '../types/world';

export interface DecorationOption {
  id: DecorationId;
  category: DecorationCategory;
  name: string;
  description: string;
  requirement?: string;
}

export interface DecorationCategoryInfo {
  id: DecorationCategory;
  label: string;
  blurb: string;
  defaultValue: DecorationId;
}

export const DECORATION_CATEGORIES: readonly DecorationCategoryInfo[] = [
  {
    id: 'planter',
    label: 'The Big Planter',
    blurb: 'What grows beside the table.',
    defaultValue: 'fern',
  },
  {
    id: 'lantern',
    label: 'Lantern Light',
    blurb: 'The colour of the rooftop after dark.',
    defaultValue: 'amber-glow',
  },
  {
    id: 'rug',
    label: 'Underfoot',
    blurb: 'Something soft for bare feet.',
    defaultValue: 'woven-rug',
  },
  {
    id: 'trinket',
    label: 'On the Table',
    blurb: 'A small thing to keep the tea company.',
    defaultValue: 'teacup',
  },
];

export const DECORATIONS: readonly DecorationOption[] = [
  {
    id: 'fern',
    category: 'planter',
    name: 'Maidenhair Fern',
    description: 'Feathery, forgiving, and fond of being misted.',
  },
  {
    id: 'lavender',
    category: 'planter',
    name: 'Rooftop Lavender',
    description: 'It smells like clean sheets and slow evenings.',
  },
  {
    id: 'night-bloom',
    category: 'planter',
    name: 'Night Bloom',
    description: 'A moonflower that opens only for quiet visitors.',
    requirement: 'Find two rooftop secrets.',
  },
  {
    id: 'amber-glow',
    category: 'lantern',
    name: 'Amber Lanterns',
    description: 'The colour of honey held up to a candle.',
  },
  {
    id: 'moonlit',
    category: 'lantern',
    name: 'Moonlit Lanterns',
    description: 'Lanterns filled with captured moonlight, cool and silver.',
    requirement: 'Discover two constellations.',
  },
  {
    id: 'woven-rug',
    category: 'rug',
    name: 'Woven Night Rug',
    description: 'Indigo wool, a little frayed at one corner.',
  },
  {
    id: 'star-quilt',
    category: 'rug',
    name: 'Star Quilt',
    description: 'A patchwork quilt of tiny constellations, warm from somewhere.',
    requirement: 'Find four rooftop secrets.',
  },
  {
    id: 'teacup',
    category: 'trinket',
    name: 'Chipped Teacup',
    description: 'Still warm. Nobody remembers pouring it.',
  },
  {
    id: 'orrery',
    category: 'trinket',
    name: 'Little Brass Orrery',
    description: 'A model of a sky that does not exist, ticking very softly.',
    requirement: 'Collect all five sky keepsakes.',
  },
];

export const DEFAULT_SELECTIONS: Selections = {
  planter: 'fern',
  lantern: 'amber-glow',
  rug: 'woven-rug',
  trinket: 'teacup',
};

export function isDecorationUnlocked(id: DecorationId, state: WorldState): boolean {
  if (state.unlockedDecorations.includes(id)) return true;
  switch (id) {
    case 'night-bloom':
      return state.hidden.length >= 2;
    case 'moonlit':
      return state.constellations.length >= 2;
    case 'star-quilt':
      return state.hidden.length >= 4;
    case 'orrery':
      return state.celestial.length >= 5;
    default:
      return true;
  }
}

export function availableDecorations(
  category: DecorationCategory,
  state: WorldState,
): DecorationOption[] {
  return DECORATIONS.filter(
    (option) => option.category === category && isDecorationUnlocked(option.id, state),
  );
}

export function selectableDecoration(
  category: DecorationCategory,
  id: DecorationId,
  state: WorldState,
): boolean {
  const option = DECORATIONS.find((item) => item.id === id && item.category === category);
  return Boolean(option && isDecorationUnlocked(id, state));
}
