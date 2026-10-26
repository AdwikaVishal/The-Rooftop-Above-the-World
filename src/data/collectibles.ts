import type { CelestialId } from '../types/world';

export type CollectibleGlyph =
  | 'star'
  | 'moonthread'
  | 'comet'
  | 'firefly'
  | 'dust'
  | 'boat'
  | 'key'
  | 'feather'
  | 'jam'
  | 'chalk'
  | 'flower'
  | 'moon';

export interface Celestial {
  id: CelestialId;
  name: string;
  glyph: CollectibleGlyph;
  description: string;
  hint: string;
  condition: string;
}

export const CELESTIALS: readonly Celestial[] = [
  {
    id: 'quiet-star',
    name: 'The Quiet Star',
    glyph: 'star',
    description:
      'A shy star that blooms when the rooftop lanterns are turned down. It had been there all along, waiting for someone to notice the dark.',
    hint: 'Some lights are best seen after the lanterns go out.',
    condition: 'Turn the rooftop lanterns off.',
  },
  {
    id: 'moonthread',
    name: 'Moonthread',
    glyph: 'moonthread',
    description:
      'A silver strand of moonlight, cool between your fingers. It hums very faintly, like a faraway lullaby.',
    hint: 'The moon looks especially touchable tonight.',
    condition: 'Touch the moon.',
  },
  {
    id: 'comet-tear',
    name: "Comet's Tear",
    glyph: 'comet',
    description:
      'A warm ember left behind by a comet that passed too quickly to say hello. It still remembers being a star.',
    hint: 'The telescope will show you where the old fires went.',
    condition: 'Discover a constellation through the telescope.',
  },
  {
    id: 'firefly-ember',
    name: 'Firefly Ember',
    glyph: 'firefly',
    description:
      'A tiny glow that trusted you enough to be caught three times. It settles in your palm, perfectly content.',
    hint: 'The fireflies among the plants are curious about patient visitors.',
    condition: 'Catch three fireflies.',
  },
  {
    id: 'wishing-dust',
    name: 'Wishing Dust',
    glyph: 'dust',
    description:
      'What three sleepy plants whisper when someone finally notices all of them. It tastes faintly of rain and honey.',
    hint: 'There are three growing things here that would like a little attention.',
    condition: 'Touch all three plants.',
  },
  {
    id: 'starglass',
    name: 'A Shard of Starglass',
    glyph: 'moon',
    description:
      'A small piece of midnight-blue glass, cool to the touch. It holds a reflection of a sky that is not quite this one.',
    hint: 'Look for a wandering blue light in the wider sky.',
    condition: 'Find the drifting blue light in the dreamscape.',
  },
];

export const CELESTIAL_BY_ID = new Map(CELESTIALS.map((item) => [item.id, item]));
