export type SharedGardenItemKind = 'flower' | 'lantern' | 'note' | 'decoration';

export interface SharedGardenItem {
  id: string;
  kind: SharedGardenItemKind;
  note: string;
  from: string;
  createdAt: number;
}

export interface SharedPostcard {
  id: string;
  message: string;
  from: string;
  createdAt: number;
}

export interface SharedGarden {
  version: 1;
  id: string;
  name: string;
  owner: string;
  createdAt: number;
  updatedAt: number;
  items: SharedGardenItem[];
  postcards: SharedPostcard[];
}

export interface SharedGardenDraft {
  name: string;
  owner: string;
}

const STORAGE_KEY = 'rooftop-above-the-world:together';
const SHARE_PREFIX = 'together';
const MAX_ITEMS = 80;
const MAX_POSTCARDS = 60;

const ITEM_KINDS = new Set<SharedGardenItemKind>(['flower', 'lantern', 'note', 'decoration']);

function makeId(prefix: string): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );
}

function clean(value: unknown, max: number, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  return value.trim().slice(0, max);
}

function readTime(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readItem(value: unknown): SharedGardenItem | null {
  if (!isRecord(value)) return null;
  const kind = value.kind;
  if (typeof kind !== 'string' || !ITEM_KINDS.has(kind as SharedGardenItemKind)) return null;
  const note = clean(value.note, 500);
  if (!note) return null;
  return {
    id: clean(value.id, 100) || makeId('item'),
    kind: kind as SharedGardenItemKind,
    note,
    from: clean(value.from, 40, 'Someone') || 'Someone',
    createdAt: readTime(value.createdAt, Date.now()),
  };
}

function readPostcard(value: unknown): SharedPostcard | null {
  if (!isRecord(value)) return null;
  const message = clean(value.message, 400);
  if (!message) return null;
  return {
    id: clean(value.id, 100) || makeId('postcard'),
    message,
    from: clean(value.from, 40, 'Someone') || 'Someone',
    createdAt: readTime(value.createdAt, Date.now()),
  };
}

export function parseSharedGarden(value: unknown): SharedGarden | null {
  if (!isRecord(value)) return null;
  if (value.version !== 1) return null;
  const name = clean(value.name, 60);
  if (!name) return null;
  const items = Array.isArray(value.items)
    ? value.items.map(readItem).filter((item): item is SharedGardenItem => item !== null)
    : [];
  const postcards = Array.isArray(value.postcards)
    ? value.postcards
        .map(readPostcard)
        .filter((postcard): postcard is SharedPostcard => postcard !== null)
    : [];
  return {
    version: 1,
    id: clean(value.id, 100) || makeId('garden'),
    name,
    owner: clean(value.owner, 40, 'Someone') || 'Someone',
    createdAt: readTime(value.createdAt, Date.now()),
    updatedAt: readTime(value.updatedAt, Date.now()),
    items: items.slice(-MAX_ITEMS),
    postcards: postcards.slice(-MAX_POSTCARDS),
  };
}

export function createSharedGarden(draft: SharedGardenDraft, now = Date.now()): SharedGarden {
  return {
    version: 1,
    id: makeId('garden'),
    name: clean(draft.name, 60, 'Our little rooftop') || 'Our little rooftop',
    owner: clean(draft.owner, 40, 'Someone') || 'Someone',
    createdAt: now,
    updatedAt: now,
    items: [],
    postcards: [],
  };
}

export function addGardenItem(
  garden: SharedGarden,
  input: { kind: SharedGardenItemKind; note: string; from: string },
  now = Date.now(),
): SharedGarden {
  const note = clean(input.note, 500);
  if (!note) return garden;
  const item: SharedGardenItem = {
    id: makeId('item'),
    kind: input.kind,
    note,
    from: clean(input.from, 40, 'Someone') || 'Someone',
    createdAt: now,
  };
  return {
    ...garden,
    updatedAt: now,
    items: [...garden.items, item].slice(-MAX_ITEMS),
  };
}

export function addSharedPostcard(
  garden: SharedGarden,
  input: { message: string; from: string },
  now = Date.now(),
): SharedGarden {
  const message = clean(input.message, 400);
  if (!message) return garden;
  const postcard: SharedPostcard = {
    id: makeId('postcard'),
    message,
    from: clean(input.from, 40, 'Someone') || 'Someone',
    createdAt: now,
  };
  return {
    ...garden,
    updatedAt: now,
    postcards: [...garden.postcards, postcard].slice(-MAX_POSTCARDS),
  };
}

export function mergeSharedGardens(local: SharedGarden | null, incoming: SharedGarden): SharedGarden {
  if (!local) return incoming;
  const itemMap = new Map(local.items.map((item) => [item.id, item]));
  for (const item of incoming.items) itemMap.set(item.id, item);
  const postcardMap = new Map(local.postcards.map((postcard) => [postcard.id, postcard]));
  for (const postcard of incoming.postcards) postcardMap.set(postcard.id, postcard);
  return {
    ...local,
    updatedAt: Math.max(local.updatedAt, incoming.updatedAt, Date.now()),
    items: [...itemMap.values()].sort((a, b) => a.createdAt - b.createdAt).slice(-MAX_ITEMS),
    postcards: [...postcardMap.values()]
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-MAX_POSTCARDS),
  };
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeShareCode(garden: SharedGarden): string {
  return toBase64Url(
    JSON.stringify({ type: 'rooftop-shared-garden', version: 1, garden }),
  );
}

export function decodeShareCode(raw: string): SharedGarden | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const marker = trimmed.includes('#') ? '#' : trimmed.includes('?') ? '?' : null;
  let candidate = trimmed;
  if (marker) {
    const urlish = trimmed.slice(trimmed.indexOf(marker) + 1);
    const params = new URLSearchParams(urlish);
    candidate = params.get(SHARE_PREFIX) ?? urlish.split('&')[0]?.split('#')[0] ?? '';
  }
  if (!candidate) return null;
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(candidate));
    if (!isRecord(parsed)) return null;
    if (parsed.type !== 'rooftop-shared-garden') return null;
    return parseSharedGarden(parsed.garden);
  } catch {
    return null;
  }
}

export function buildShareLink(code: string): string {
  if (typeof window === 'undefined') return `#${SHARE_PREFIX}=${code}`;
  return `${window.location.origin}${window.location.pathname}#${SHARE_PREFIX}=${code}`;
}

export function readIncomingShareCode(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#/, '');
  if (hash) {
    const params = new URLSearchParams(hash);
    const code = params.get(SHARE_PREFIX);
    if (code) return code;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get(SHARE_PREFIX);
}

export function clearIncomingShareCode(): void {
  if (typeof window === 'undefined') return;
  const url = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(null, '', url);
}

export function loadSharedGarden(): SharedGarden | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseSharedGarden(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveSharedGarden(garden: SharedGarden): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(garden));
    return true;
  } catch {
    return false;
  }
}

export function deleteSharedGarden(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function itemKindLabel(kind: SharedGardenItemKind): string {
  switch (kind) {
    case 'flower':
      return 'A flower';
    case 'lantern':
      return 'A lantern';
    case 'note':
      return 'A little note';
    case 'decoration':
      return 'A small decoration';
  }
}
