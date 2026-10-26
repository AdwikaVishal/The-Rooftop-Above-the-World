import type { FeelingId } from '../types/world';

export interface FeelingDefinition {
  id: FeelingId;
  label: string;
  blurb: string;
  color: string;
}

export const FEELINGS: readonly FeelingDefinition[] = [
  { id: 'heavy', label: 'Heavy', blurb: 'Something is weighing on me.', color: '#8d90b8' },
  { id: 'tender', label: 'Tender', blurb: 'I am feeling a little fragile.', color: '#d9a4b3' },
  { id: 'restless', label: 'Restless', blurb: 'My mind will not settle.', color: '#e0b67c' },
  { id: 'lonely', label: 'Lonely', blurb: 'I miss being understood.', color: '#9c91c8' },
  { id: 'hopeful', label: 'Hopeful', blurb: 'Something small is opening.', color: '#c9d38d' },
  { id: 'grateful', label: 'Grateful', blurb: 'I want to keep this feeling.', color: '#f2c879' },
  { id: 'angry', label: 'Angry', blurb: 'Something needs to be heard.', color: '#d1877f' },
  { id: 'calm', label: 'Calm', blurb: 'The noise has softened.', color: '#9caf98' },
  { id: 'numb', label: 'Numb', blurb: 'I am not sure what I feel.', color: '#a9adbb' },
  { id: 'missing-someone', label: 'Missing someone', blurb: 'Distance is sitting close tonight.', color: '#b7a9d6' },
];

export const FEELING_BY_ID = new Map(FEELINGS.map((feeling) => [feeling.id, feeling]));
export const FEELING_IDS = new Set<string>(FEELINGS.map((feeling) => feeling.id));
