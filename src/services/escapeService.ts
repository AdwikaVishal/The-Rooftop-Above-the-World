import type { EscapeFeedback, EscapeSceneId } from '../data/escape';

export interface EscapeMemory {
  version: 1;
  hasArrived: boolean;
  sessions: number;
  lastScene: EscapeSceneId | null;
  feedback: Record<EscapeFeedback, number>;
}

const STORAGE_KEY = 'rooftop-above-the-world:escape';

const EMPTY_MEMORY: EscapeMemory = {
  version: 1,
  hasArrived: false,
  sessions: 0,
  lastScene: null,
  feedback: { helpful: 0, somewhat: 0, 'not-really': 0 },
};

function readFeedback(value: unknown, key: EscapeFeedback): number {
  if (typeof value !== 'object' || value === null) return 0;
  const raw = (value as Record<string, unknown>)[key];
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(99999, Math.floor(raw)));
}

function isScene(value: unknown): value is EscapeSceneId {
  return value === 'rain' || value === 'stars' || value === 'garden' || value === 'whisker';
}

export function loadEscapeMemory(): EscapeMemory {
  if (typeof window === 'undefined') return { ...EMPTY_MEMORY, feedback: { ...EMPTY_MEMORY.feedback } };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_MEMORY, feedback: { ...EMPTY_MEMORY.feedback } };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || parsed.version !== 1) {
      return { ...EMPTY_MEMORY, feedback: { ...EMPTY_MEMORY.feedback } };
    }
    const feedback = parsed.feedback;
    const readCount = (value: unknown): number =>
      typeof value === 'number' && Number.isFinite(value)
        ? Math.max(0, Math.min(99999, Math.floor(value)))
        : 0;
    return {
      version: 1,
      hasArrived: typeof parsed.hasArrived === 'boolean' ? parsed.hasArrived : false,
      sessions: readCount(parsed.sessions),
      lastScene: isScene(parsed.lastScene) ? parsed.lastScene : null,
      feedback: {
        helpful: readFeedback(feedback, 'helpful'),
        somewhat: readFeedback(feedback, 'somewhat'),
        'not-really': readFeedback(feedback, 'not-really'),
      },
    };
  } catch {
    return { ...EMPTY_MEMORY, feedback: { ...EMPTY_MEMORY.feedback } };
  }
}

function saveEscapeMemory(memory: EscapeMemory): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // Escape memories are optional; a full storage should never block the rooftop.
  }
}

export function hasArrived(): boolean {
  return loadEscapeMemory().hasArrived;
}

export function markArrived(): EscapeMemory {
  const memory = { ...loadEscapeMemory(), hasArrived: true };
  saveEscapeMemory(memory);
  return memory;
}

export function recordEscapeStart(scene: EscapeSceneId): EscapeMemory {
  const memory = loadEscapeMemory();
  const next: EscapeMemory = {
    ...memory,
    sessions: Math.min(memory.sessions + 1, 99999),
    lastScene: scene,
  };
  saveEscapeMemory(next);
  return next;
}

export function recordEscapeFeedback(feedback: EscapeFeedback): EscapeMemory {
  const memory = loadEscapeMemory();
  const next: EscapeMemory = {
    ...memory,
    feedback: {
      ...memory.feedback,
      [feedback]: Math.min(memory.feedback[feedback] + 1, 99999),
    },
  };
  saveEscapeMemory(next);
  return next;
}

export function clearEscapeMemory(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
