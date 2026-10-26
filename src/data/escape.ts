import type { GardenWeather } from '../types/world';

export type EscapeSceneId = 'rain' | 'stars' | 'garden' | 'whisker';

export interface EscapeSceneDefinition {
  id: EscapeSceneId;
  title: string;
  subtitle: string;
  weather: GardenWeather;
  prompts: readonly string[];
}

export const ESCAPE_SCENES: readonly EscapeSceneDefinition[] = [
  {
    id: 'rain',
    title: 'Soft rain on the roof',
    subtitle: 'Let the sound cover everything for a little while.',
    weather: 'rain',
    prompts: [
      'Let your shoulders drop away from your ears.',
      'Listen for the quietest part of the rain.',
      'You do not have to solve anything from here.',
      'Notice one place where your body is resting against something.',
      'Let the next breath be a little slower than the last.',
    ],
  },
  {
    id: 'stars',
    title: 'A sky full of stars',
    subtitle: 'Nothing is expected of you under a sky this large.',
    weather: 'clear',
    prompts: [
      'Find one star and let your eyes rest there.',
      'There is no right way to look at the sky.',
      'Let a thought pass without following it.',
      'Unclench your jaw, if you can.',
      'The night is not asking you to be anything.',
    ],
  },
  {
    id: 'garden',
    title: 'The garden at night',
    subtitle: 'Small growing things, keeping you company.',
    weather: 'breeze',
    prompts: [
      'Notice the slow breathing of the leaves.',
      'You are allowed to grow at your own pace.',
      'Touch something nearby, or simply imagine it.',
      'Nothing in this garden is in a hurry.',
      'Let one small thing be enough for now.',
    ],
  },
  {
    id: 'whisker',
    title: 'Sit with Whisker',
    subtitle: 'A warm cat, a quiet roof, no conversation required.',
    weather: 'clear',
    prompts: [
      'Whisker does not need you to explain anything.',
      'Let your hands rest. Let the cat be a cat.',
      'Notice the weight of this moment, without judging it.',
      'A slow blink is a whole sentence.',
      'You can stay exactly as you are.',
    ],
  },
];

export const ESCAPE_SCENE_BY_ID = new Map(ESCAPE_SCENES.map((scene) => [scene.id, scene]));

export const ESCAPE_DURATIONS = [
  { seconds: 60, label: '1 minute' },
  { seconds: 180, label: '3 minutes' },
  { seconds: 300, label: '5 minutes' },
] as const;

export type EscapeFeedback = 'helpful' | 'somewhat' | 'not-really';
