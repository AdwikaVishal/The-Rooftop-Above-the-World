import type { IslandId } from '../types/world';

export interface DreamIsland {
  id: IslandId;
  name: string;
  description: string;
  hint: string;
  prompt?: string;
  position: readonly [number, number, number];
  color: string;
}

export const DREAM_ISLANDS: readonly DreamIsland[] = [
  {
    id: 'moon-garden',
    name: 'The Moon Garden',
    description: 'A quiet garden where small flowers open toward the moon.',
    hint: 'The first island holds a garden that only blooms at night.',
    position: [-25, 3, -25],
    color: '#9caf98',
  },
  {
    id: 'cloud-cottage',
    name: 'The Cloud Cottage',
    description: 'A little cottage keeps watch from a pillow of lavender cloud.',
    hint: 'A warm window glows somewhere among the clouds.',
    position: [25, 6, -27],
    color: '#d9a4b3',
  },
  {
    id: 'little-observatory',
    name: 'The Little Observatory',
    description: 'A tiny observatory turns slowly toward stars it has not met yet.',
    hint: 'Follow the farthest lantern to the observatory.',
    position: [0, 13, -45],
    color: '#c3b9e8',
  },
  {
    id: 'island-of-grief',
    name: 'The Island of Remembering',
    description: 'A soft-lit place for holding the people, places, and seasons we miss.',
    hint: 'A quiet shore keeps a light for what you carry.',
    prompt: 'If you like, remember one small detail you would not want the world to forget.',
    position: [-39, 8, -12],
    color: '#9eabc8',
  },
  {
    id: 'island-of-change',
    name: 'The Island of Becoming',
    description: 'A path that makes room for beginnings that do not need to be hurried.',
    hint: 'Look for a path still becoming itself.',
    prompt: 'What is one thing you are allowed to take at your own pace?',
    position: [39, 9, -12],
    color: '#c3a5a5',
  },
  {
    id: 'island-of-belonging',
    name: 'The Island of Belonging',
    description: 'A little gathering place with room for being exactly as you are.',
    hint: 'Somewhere, a small gathering place has an open seat.',
    prompt: 'Where, or with whom, do you feel a little more like yourself?',
    position: [-39, 15, -34],
    color: '#9caf98',
  },
  {
    id: 'island-of-rest',
    name: 'The Island of Rest',
    description: 'A cloud-soft corner where nothing needs to be accomplished.',
    hint: 'Find the cloud that is not going anywhere.',
    prompt: 'What would make the next few minutes feel gentler?',
    position: [39, 16, -35],
    color: '#b8acd7',
  },
  {
    id: 'island-of-hope',
    name: 'The Island of Small Hopes',
    description: 'A lantern garden for tiny possibilities, however quiet or uncertain.',
    hint: 'A distant lantern is keeping a little light.',
    prompt: 'Is there one small thing you might look forward to, even a little?',
    position: [0, 21, -61],
    color: '#dfbd7f',
  },
];

export const ISLAND_BY_ID = new Map(DREAM_ISLANDS.map((island) => [island.id, island]));
