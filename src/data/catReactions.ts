import type { CatReactionId } from '../types/world';

export interface CatReaction {
  id: CatReactionId;
  name: string;
  description: string;
  bubble: string;
}

export const CAT_REACTIONS: readonly CatReaction[] = [
  {
    id: 'purr',
    name: 'The Purr',
    description:
      'A low, steady rumble that travels up your arm. Whisker does not open his eyes, but the corner of his mouth lifts.',
    bubble: 'prrrrrrr…',
  },
  {
    id: 'slow-blink',
    name: 'The Slow Blink',
    description:
      'One eye opens, closes slowly, then the other follows. In cat, this is a small kiss. You have been trusted.',
    bubble: 'mrrp',
  },
  {
    id: 'stretch',
    name: 'The Long Stretch',
    description:
      'Toes spread, back arches into a soft crescent, and every whisker points in a different direction. The world is briefly rearranged.',
    bubble: 'streeetch',
  },
  {
    id: 'yawn',
    name: 'The Little Yawn',
    description:
      'A pink tongue appears, a tiny squeak escapes, and dignity is immediately restored. Whisker pretends it never happened.',
    bubble: 'yaaawn',
  },
  {
    id: 'tail-curl',
    name: 'The Tail Curl',
    description:
      'His tail lifts into a slow question mark and curls around your wrist. It is a very good question, and the answer is yes.',
    bubble: 'mew?',
  },
];

export const CAT_REACTION_BY_ID = new Map(CAT_REACTIONS.map((item) => [item.id, item]));
