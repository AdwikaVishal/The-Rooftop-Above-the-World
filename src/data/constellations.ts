import type { ConstellationId } from '../types/world';

export interface StarPoint {
  x: number;
  y: number;
  size?: number;
}

export interface Constellation {
  id: ConstellationId;
  name: string;
  subtitle: string;
  story: string;
  whisper: string;
  accent: string;
  points: readonly StarPoint[];
  lines: readonly (readonly [number, number])[];
  trace: readonly number[];
  map: { x: number; y: number; width: number };
}

export const CONSTELLATIONS: readonly Constellation[] = [
  {
    id: 'sleeping-fox',
    name: 'The Sleeping Fox',
    subtitle: 'the one who curls around the moon',
    story:
      'High above the rooftops, a fox made of six quiet stars curls around the moon. The city believes it is only a scatter of light. The rooftop knows better.',
    whisper: 'It twitches one ear when the wind changes.',
    accent: '#e7b88d',
    points: [
      { x: 12, y: 54, size: 2.2 },
      { x: 23, y: 40, size: 1.6 },
      { x: 36, y: 45, size: 2.8 },
      { x: 48, y: 33, size: 1.8 },
      { x: 62, y: 39, size: 2.1 },
      { x: 76, y: 31, size: 2.6 },
      { x: 87, y: 43, size: 1.7 },
      { x: 80, y: 58, size: 2.2 },
      { x: 66, y: 63, size: 1.5 },
      { x: 49, y: 60, size: 1.8 },
      { x: 33, y: 65, size: 2.3 },
      { x: 18, y: 62, size: 1.6 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 10],
      [10, 11],
      [11, 0],
      [2, 9],
    ],
    trace: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0],
    map: { x: 24, y: 29, width: 46 },
  },
  {
    id: 'paper-crane',
    name: 'The Paper Crane',
    subtitle: 'a wish that learned to fly',
    story:
      'Someone once folded a wish so carefully that it lifted into the sky. On clear nights its wings catch the lantern light, and every fold remembers being made by hand.',
    whisper: 'It never lands. It is not in a hurry.',
    accent: '#c3b9e8',
    points: [
      { x: 8, y: 66, size: 1.8 },
      { x: 22, y: 52, size: 2.5 },
      { x: 35, y: 58, size: 1.7 },
      { x: 48, y: 43, size: 2.9 },
      { x: 61, y: 55, size: 1.9 },
      { x: 76, y: 48, size: 2.2 },
      { x: 88, y: 61, size: 1.6 },
      { x: 63, y: 72, size: 2.1 },
      { x: 43, y: 76, size: 1.5 },
      { x: 27, y: 73, size: 1.9 },
    ],
    lines: [
      [0, 1],
      [1, 3],
      [3, 5],
      [5, 6],
      [5, 4],
      [4, 7],
      [7, 8],
      [8, 9],
      [9, 1],
      [3, 2],
      [2, 4],
      [8, 3],
    ],
    trace: [0, 1, 3, 5, 6, 5, 4, 7, 8, 9, 1, 3, 2, 4],
    map: { x: 7, y: 55, width: 39 },
  },
  {
    id: 'lantern-keeper',
    name: 'The Lantern Keeper',
    subtitle: 'the one who walks the long dark',
    story:
      'A figure of nine stars carries a small light across the dark. They say it lights the way home for anyone still awake, and that the light is never quite the same colour twice.',
    whisper: 'If you are very still, the little light seems to swing.',
    accent: '#f2c879',
    points: [
      { x: 50, y: 10, size: 2.2 },
      { x: 42, y: 23, size: 1.6 },
      { x: 58, y: 26, size: 1.7 },
      { x: 73, y: 18, size: 2.8 },
      { x: 61, y: 39, size: 2.5 },
      { x: 48, y: 47, size: 1.6 },
      { x: 70, y: 54, size: 1.9 },
      { x: 42, y: 62, size: 2.1 },
      { x: 55, y: 69, size: 1.7 },
      { x: 60, y: 84, size: 2.4 },
    ],
    lines: [
      [0, 1],
      [0, 2],
      [0, 4],
      [2, 4],
      [2, 6],
      [6, 4],
      [4, 5],
      [5, 7],
      [7, 8],
      [8, 9],
      [4, 8],
      [3, 4],
    ],
    trace: [0, 1, 0, 2, 4, 3, 4, 5, 7, 8, 9],
    map: { x: 54, y: 8, width: 38 },
  },
];

export const CONSTELLATION_BY_ID = new Map(CONSTELLATIONS.map((item) => [item.id, item]));

export function isValidTraceStep(
  constellation: Constellation,
  traced: readonly number[],
  candidate: number,
): boolean {
  const expected = constellation.trace[traced.length];
  if (expected !== candidate || expected === undefined) return false;
  if (traced.length === 0) return true;

  const previous = traced[traced.length - 1];
  if (previous === undefined) return false;
  return constellation.lines.some(
    ([start, end]) =>
      (start === previous && end === candidate) ||
      (start === candidate && end === previous),
  );
}

export function matchesConstellationTrace(
  constellation: Constellation,
  traced: readonly number[],
): boolean {
  return (
    traced.length === constellation.trace.length &&
    traced.every((star, index) => star === constellation.trace[index])
  );
}
