import type { HiddenId, WorldState } from '../types/world';
import type { CollectibleGlyph } from './collectibles';

export interface HiddenDiscovery {
  id: HiddenId;
  name: string;
  glyph: CollectibleGlyph;
  description: string;
  hint: string;
  location: string;
}

export const HIDDEN_DISCOVERIES: readonly HiddenDiscovery[] = [
  {
    id: 'paper-boat',
    name: 'Paper Boat',
    glyph: 'boat',
    description:
      'A tiny folded boat, dry despite the weather. Someone sailed it across the rooftop in their imagination and left it anchored by the flowers.',
    hint: 'Something folded and white is keeping the big planter company.',
    location: 'By the big planter',
  },
  {
    id: 'brass-key',
    name: 'Little Brass Key',
    glyph: 'key',
    description:
      'It opens nothing on this rooftop. Perhaps that is the point. It is warm from being held, though no one has held it for years.',
    hint: 'The telescope tripod has three feet, and something small between them.',
    location: 'At the telescope',
  },
  {
    id: 'moon-feather',
    name: 'Moonlit Feather',
    glyph: 'feather',
    description:
      'Soft as a moth\'s wing, bright as the moon. It must have drifted down from somewhere impossible, and it smells faintly of cold air.',
    hint: 'The railing catches more than string lights.',
    location: 'On the railing',
  },
  {
    id: 'jam-jar',
    name: 'Half-Finished Jam',
    glyph: 'jam',
    description:
      'Blackberry jam, one spoon left. Whisker denies all knowledge, but there is a suspicious purplish smear on one whisker.',
    hint: 'Whisker is sleeping very close to something sweet.',
    location: 'Behind the cushion',
  },
  {
    id: 'chalk-star',
    name: 'Chalk Star',
    glyph: 'chalk',
    description:
      'A five-pointed wish drawn in white chalk. The edges have softened with time, but the shape still holds, patient as anything.',
    hint: 'Look at the floor near the edge of the rug.',
    location: 'On the rooftop floor',
  },
  {
    id: 'lantern-note',
    name: 'A Note in the Lantern',
    glyph: 'chalk',
    description:
      'A small note appears in the lantern glass after the Sleeping Fox is traced and the rooftop lights are touched. It reads: “The dark is part of the picture.”',
    hint: 'Trace the Sleeping Fox, then tend to the rooftop lights.',
    location: 'In the lantern glass',
  },
  {
    id: 'whisker-charm',
    name: 'Whisker’s Firefly Charm',
    glyph: 'firefly',
    description:
      'A little brass charm, warm with a firefly’s glow. Whisker found it while chasing a light and has decided it belongs to you.',
    hint: 'Spend a little time with Whisker, then catch a firefly.',
    location: 'Beside Whisker’s cushion',
  },
  {
    id: 'moon-seed',
    name: 'Moon Garden Seed',
    glyph: 'flower',
    description:
      'A silver seed rests in the soil after the moon has been greeted and every rooftop plant has been noticed. It is already dreaming of spring.',
    hint: 'Greet the moon and touch each of the rooftop plants.',
    location: 'In the big planter',
  },
];

export const HIDDEN_BY_ID = new Map(HIDDEN_DISCOVERIES.map((item) => [item.id, item]));

const ROOFTOP_PLANTS = ['fern', 'lavender', 'ivy'] as const;

export interface SecretEvent {
  id: string;
  reward: HiddenId;
  isTriggered: (state: WorldState) => boolean;
}

export const SECRET_EVENTS: readonly SecretEvent[] = [
  {
    id: 'lantern-whisper',
    reward: 'lantern-note',
    isTriggered: (state) =>
      state.constellations.includes('sleeping-fox') && state.counters.lightsToggled > 0,
  },
  {
    id: 'firefly-companion',
    reward: 'whisker-charm',
    isTriggered: (state) => state.counters.catPets >= 3 && state.counters.firefliesCaught > 0,
  },
  {
    id: 'moon-garden',
    reward: 'moon-seed',
    isTriggered: (state) =>
      state.counters.moonClicked &&
      state.counters.plantsTouched.length === 3 &&
      ROOFTOP_PLANTS.every((plant) => state.counters.plantsTouched.includes(plant)),
  },
];
