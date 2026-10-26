export type ComfortKind = 'memory' | 'song' | 'message' | 'person' | 'photo' | 'link';

export interface PrivateEntry {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  kind?: ComfortKind;
  link?: string;
  imageData?: string;
}

export interface PrivateSanctuaryData {
  version: 1;
  letters: PrivateEntry[];
  lanterns: PrivateEntry[];
  keepsakes: PrivateEntry[];
}

const STORAGE_KEY = 'rooftop-above-the-world:private-sanctuary';
const EMPTY_DATA: PrivateSanctuaryData = { version: 1, letters: [], lanterns: [], keepsakes: [] };

function isEntry(value: unknown): value is PrivateEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.title === 'string' &&
    typeof entry.content === 'string' &&
    typeof entry.createdAt === 'number' &&
    typeof entry.updatedAt === 'number'
  );
}

function readEntries(value: unknown): PrivateEntry[] {
  if (!Array.isArray(value) || !value.every(isEntry)) {
    throw new Error('Private notes could not be read because one collection is damaged.');
  }
  return value;
}

export function loadPrivateSanctuary(): PrivateSanctuaryData {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...EMPTY_DATA };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Private notes could not be read because their saved data is damaged.');
  }
  if (typeof parsed !== 'object' || parsed === null || (parsed as { version?: unknown }).version !== 1) {
    throw new Error('Private notes use an unrecognized format and were not changed.');
  }
  const record = parsed as Record<string, unknown>;
  return {
    version: 1,
    letters: readEntries(record.letters),
    lanterns: readEntries(record.lanterns),
    keepsakes: readEntries(record.keepsakes),
  };
}

export function savePrivateSanctuary(data: PrivateSanctuaryData): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function deletePrivateSanctuary(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function createPrivateEntry(title: string, content: string, now = Date.now()): PrivateEntry {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `private-${now}-${Math.random().toString(36).slice(2)}`,
    title: title.trim(),
    content: content.trim(),
    createdAt: now,
    updatedAt: now,
  };
}

export function createComfortEntry(
  input: {
    kind: ComfortKind;
    title: string;
    content: string;
    link?: string;
    imageData?: string;
  },
  now = Date.now(),
): PrivateEntry {
  const entry = {
    ...createPrivateEntry(input.title, input.content, now),
    kind: input.kind,
  } as PrivateEntry;
  const link = input.link?.trim();
  if (link) entry.link = link;
  if (input.imageData) entry.imageData = input.imageData;
  return entry;
}

export function exportSanctuaryAsText(data: PrivateSanctuaryData): string {
  const sections: string[] = ['The Rooftop Above the World — private notes', ''];
  const append = (heading: string, entries: PrivateEntry[], showKind = false): void => {
    sections.push(heading, '');
    if (entries.length === 0) {
      sections.push('(nothing kept here)', '');
      return;
    }
    for (const entry of entries) {
      const date = new Date(entry.createdAt).toLocaleString();
      sections.push(
        `${showKind && entry.kind ? `[${entry.kind}] ` : ''}${entry.title}`,
        `Saved ${date}`,
        entry.content || '(no words)',
      );
      if (entry.link) sections.push(`Link: ${entry.link}`);
      sections.push('');
    }
  };
  append('Letters you could not send', data.letters);
  append('Lanterns', data.lanterns);
  append('Comfort shelf', data.keepsakes, true);
  return sections.join('\n');
}
