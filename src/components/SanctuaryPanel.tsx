import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  BookHeart,
  BookOpen,
  Check,
  CloudMoon,
  Copy,
  Download,
  Feather,
  Heart,
  HeartHandshake,
  Image,
  Lamp,
  Library,
  Link2,
  LockKeyhole,
  MessageCircleHeart,
  MoonStar,
  Music,
  Quote,
  UserRound,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  createComfortEntry,
  createPrivateEntry,
  deletePrivateSanctuary,
  exportSanctuaryAsText,
  loadPrivateSanctuary,
  savePrivateSanctuary,
  type ComfortKind,
  type PrivateEntry,
  type PrivateSanctuaryData,
} from '../services/privateSanctuaryService';
import { Modal, PanelHeader } from './Modal';

type SanctuaryTab =
  | 'arrival'
  | 'letters'
  | 'lanterns'
  | 'keepsakes'
  | 'shelf'
  | 'words'
  | 'support'
  | 'privacy';

const TABS: { id: SanctuaryTab; label: string }[] = [
  { id: 'arrival', label: 'A soft landing' },
  { id: 'letters', label: 'Letters you could not send' },
  { id: 'lanterns', label: 'Lanterns' },
  { id: 'keepsakes', label: 'Tiny good things' },
  { id: 'shelf', label: 'Comfort shelf' },
  { id: 'words', label: 'A few words' },
  { id: 'support', label: 'Support' },
  { id: 'privacy', label: 'My data' },
];

const COMFORT_KINDS: readonly { id: ComfortKind; label: string; icon: typeof Heart }[] = [
  { id: 'memory', label: 'Memory', icon: Feather },
  { id: 'song', label: 'Song', icon: Music },
  { id: 'message', label: 'Reassuring message', icon: Quote },
  { id: 'person', label: 'Someone to contact', icon: UserRound },
  { id: 'photo', label: 'Photo note', icon: Image },
  { id: 'link', label: 'Link', icon: Link2 },
];

const MESSAGE_LIBRARY = [
  'You do not have to turn this moment into a lesson.',
  'Rest is a thing you are allowed to do before everything is finished.',
  'Small, ordinary joys still count.',
  'You can begin again gently, or not begin again today.',
  'Some nights are only for getting through. That is enough.',
  'There is room here for the version of you that has no words.',
];

const LETTER_STARTERS = [
  'Dear future me, I hope you remember…',
  'Something I wish I could say out loud is…',
  'For the days when everything feels like a lot…',
];

const LANTERN_PROMPTS = [
  'Something I can set down for tonight is…',
  'A small thing I want to make room for is…',
  'I hope I remember that…',
];

const EMPTY_DATA: PrivateSanctuaryData = { version: 1, letters: [], lanterns: [], keepsakes: [] };

interface SanctuaryPanelProps {
  reducedMotion: boolean;
  soundOn: boolean;
  onToggleSound: () => void;
  onQuietMode: () => void;
  onSettleCat: () => void;
  onClose: () => void;
}

export function SanctuaryPanel({
  reducedMotion,
  soundOn,
  onToggleSound,
  onQuietMode,
  onSettleCat,
  onClose,
}: SanctuaryPanelProps) {
  const [tab, setTab] = useState<SanctuaryTab>('arrival');
  const [data, setData] = useState<PrivateSanctuaryData>(EMPTY_DATA);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [folding, setFolding] = useState(false);
  const [letterTitle, setLetterTitle] = useState('');
  const [letterContent, setLetterContent] = useState('');
  const [lanternContent, setLanternContent] = useState('');
  const [keepsakeTitle, setKeepsakeTitle] = useState('');
  const [keepsakeContent, setKeepsakeContent] = useState('');
  const [keepsakeLink, setKeepsakeLink] = useState('');
  const [shelfKind, setShelfKind] = useState<ComfortKind>('memory');
  const [shelfTitle, setShelfTitle] = useState('');
  const [shelfContent, setShelfContent] = useState('');
  const [shelfLink, setShelfLink] = useState('');
  const [shelfImage, setShelfImage] = useState('');
  const [copied, setCopied] = useState(false);
  const foldTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      setData(loadPrivateSanctuary());
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Private notes could not be loaded.');
    } finally {
      setLoaded(true);
    }
    return () => {
      if (foldTimer.current !== null) window.clearTimeout(foldTimer.current);
    };
  }, []);

  const persist = (next: PrivateSanctuaryData): boolean => {
    try {
      savePrivateSanctuary(next);
      setData(next);
      setError('');
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Private notes could not be saved.');
      return false;
    }
  };

  const completeFold = (message: string): void => {
    setFolding(true);
    setStatus(message);
    if (foldTimer.current !== null) window.clearTimeout(foldTimer.current);
    foldTimer.current = window.setTimeout(() => {
      setFolding(false);
      setStatus('');
      foldTimer.current = null;
    }, reducedMotion ? 40 : 850);
  };

  const saveLetter = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!letterContent.trim()) {
      setStatus('A few words are needed to keep a letter.');
      return;
    }
    const now = Date.now();
    const previous = data.letters.find((entry) => entry.id === editingId);
    const entry = previous
      ? { ...previous, title: letterTitle.trim() || 'A letter to myself', content: letterContent.trim(), updatedAt: now }
      : createPrivateEntry(letterTitle.trim() || 'A letter to myself', letterContent, now);
    const letters = previous
      ? data.letters.map((item) => (item.id === previous.id ? entry : item))
      : [entry, ...data.letters];
    if (persist({ ...data, letters })) {
      setEditingId(null);
      setLetterTitle('');
      setLetterContent('');
      completeFold('Folded and saved on this device.');
    }
  };

  const foldWithoutSaving = (): void => {
    setEditingId(null);
    setLetterTitle('');
    setLetterContent('');
    completeFold('Folded for this moment, then let go. Nothing was saved.');
  };

  const addLantern = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const entry = createPrivateEntry('A lantern', lanternContent);
    if (persist({ ...data, lanterns: [entry, ...data.lanterns] })) {
      setLanternContent('');
      setStatus('A small light has been set afloat.');
    }
  };

  const addKeepsake = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const title = keepsakeTitle.trim();
    const content = keepsakeContent.trim();
    const link = keepsakeLink.trim();
    if (!title || (!content && !link)) {
      setStatus('Add a title and a memory or link to keep.');
      return;
    }
    const entry = createPrivateEntry(title, [content, link].filter(Boolean).join('\n\nLink: '));
    if (persist({ ...data, keepsakes: [entry, ...data.keepsakes] })) {
      setKeepsakeTitle('');
      setKeepsakeContent('');
      setKeepsakeLink('');
      setStatus('Your keepsake is tucked away on this device.');
    }
  };

  const addToComfortShelf = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const title = shelfTitle.trim();
    const content = shelfContent.trim();
    const link = shelfLink.trim();
    if (!title || (!content && !link && !shelfImage)) {
      setStatus('Add a title and something to revisit.');
      return;
    }
    const entry = createComfortEntry({
      kind: shelfKind,
      title,
      content,
      ...(link ? { link } : {}),
      ...(shelfImage ? { imageData: shelfImage } : {}),
    });
    if (persist({ ...data, keepsakes: [entry, ...data.keepsakes] })) {
      setShelfTitle('');
      setShelfContent('');
      setShelfLink('');
      setShelfImage('');
      setStatus('This comfort is tucked away on this device.');
    }
  };

  const handleImageUpload = (file: File | null): void => {
    if (!file) {
      setShelfImage('');
      return;
    }
    if (file.size > 800 * 1024) {
      setStatus('Keep images small (under 800KB) for local storage.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setShelfImage(reader.result);
        setStatus('');
      }
    };
    reader.onerror = () => setStatus('Could not read that image.');
    reader.readAsDataURL(file);
  };

  const exportAll = async (): Promise<void> => {
    try {
      const text = exportSanctuaryAsText(data);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'rooftop-private-notes.txt';
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus('Exported to your downloads folder.');
    } catch {
      setStatus('Could not export notes right now.');
    }
  };

  const copyForSelf = async (): Promise<void> => {
    try {
      const text = exportSanctuaryAsText(data);
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      setStatus('Copied to clipboard.');
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setStatus('Could not copy notes right now.');
    }
  };

  const removeEntry = (kind: 'letters' | 'lanterns' | 'keepsakes', id: string): void => {
    const next = data[kind].filter((entry) => entry.id !== id);
    if (persist({ ...data, [kind]: next })) setStatus('Removed from this device.');
  };

  const removeAllPrivateData = (): void => {
    try {
      deletePrivateSanctuary();
      setData({ ...EMPTY_DATA });
      setError('');
      setConfirmDelete(false);
      setEditingId(null);
      setLetterTitle('');
      setLetterContent('');
      setStatus('Your private notes were deleted. Rooftop discoveries were not changed.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Private notes could not be deleted.');
    }
  };

  const editLetter = (entry: PrivateEntry): void => {
    setEditingId(entry.id);
    setLetterTitle(entry.title);
    setLetterContent(entry.content);
    setStatus('');
  };

  const setStarter = (text: string): void => {
    setLetterContent((current) => (current ? `${current}\n\n${text}` : text));
  };

  const close = useCallback((): void => {
    if (foldTimer.current !== null) window.clearTimeout(foldTimer.current);
    onClose();
  }, [onClose]);

  return (
    <Modal labelledBy="sanctuary-title" onClose={close} className="sanctuary-panel">
      <PanelHeader
        eyebrow="A small, private corner"
        title="You can stay"
        titleId="sanctuary-title"
        onClose={close}
      >
        <p className="panel-intro">Nothing to finish here. Choose only what feels useful; it is all optional.</p>
      </PanelHeader>
      <nav className="sanctuary-tabs" aria-label="Quiet corner sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'is-active' : ''}
            aria-current={tab === item.id ? 'page' : undefined}
            onClick={() => { setTab(item.id); setStatus(''); }}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sanctuary-scroll">
        {error && (
          <div className="sanctuary-error" role="alert">
            <p>{error}</p>
            <button type="button" className="button-quiet" onClick={() => setTab('privacy')}>Open private-data controls</button>
          </div>
        )}
        {!loaded ? (
          <p role="status">Opening this quiet corner…</p>
        ) : (
          <>
            {tab === 'arrival' && (
              <section className="sanctuary-welcome">
                <div className="sanctuary-mark" aria-hidden="true"><MoonStar size={26} /></div>
                <p className="panel-eyebrow">Welcome, at your own pace</p>
                <h3>You do not have to do anything to be here.</h3>
                <p>Stay for a moment, wander, or close this and simply explore. No mood check-in, timer, or task is waiting.</p>
                <div className="sanctuary-actions">
                  <button type="button" className="button-primary" onClick={() => { onSettleCat(); onQuietMode(); }}>
                    <Heart size={16} aria-hidden="true" /> Settle in with Whisker
                  </button>
                  <button type="button" className="button-quiet" onClick={onClose}>Just explore</button>
                </div>
                <div className="sanctuary-sound">
                  <div>
                    <strong>Nighttime ambience</strong>
                    <span>Sound is optional and starts only when you choose.</span>
                  </div>
                  <button type="button" className="sanctuary-sound-toggle" onClick={onToggleSound} aria-pressed={soundOn}>
                    {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
                    {soundOn ? 'On' : 'Off'}
                  </button>
                </div>
              </section>
            )}

            {tab === 'letters' && (
              <section className={`sanctuary-section ${folding ? 'is-folding' : ''}`}>
                <div className="sanctuary-section-heading">
                  <BookOpen size={19} aria-hidden="true" />
                  <div><h3>Letters to yourself</h3><p>Keep one privately here, or fold it without saving.</p></div>
                </div>
                <div className="starter-list" aria-label="Optional letter starters">
                  {LETTER_STARTERS.map((starter) => (
                    <button key={starter} type="button" className="starter-chip" onClick={() => setStarter(starter)}>{starter}</button>
                  ))}
                </div>
                <form className="sanctuary-form" onSubmit={saveLetter}>
                  <label>Optional title
                    <input value={letterTitle} onChange={(event) => setLetterTitle(event.target.value)} maxLength={100} placeholder="A letter to myself" />
                  </label>
                  <label>Your letter
                    <textarea value={letterContent} onChange={(event) => setLetterContent(event.target.value)} maxLength={10000} rows={6} placeholder="Write as much or as little as you like…" />
                  </label>
                  <div className="sanctuary-actions">
                    <button type="submit" className="button-primary" disabled={!loaded || Boolean(error)}><BookHeart size={15} /> Save privately</button>
                    <button type="button" className="button-quiet" onClick={foldWithoutSaving}>Fold without saving</button>
                    {editingId && <button type="button" className="button-quiet" onClick={() => { setEditingId(null); setLetterTitle(''); setLetterContent(''); }}>Cancel edit</button>}
                  </div>
                </form>
                <EntryList
                  entries={data.letters}
                  empty="No letters kept. That is perfectly fine."
                  onDelete={(id) => removeEntry('letters', id)}
                  onEdit={editLetter}
                />
              </section>
            )}

            {tab === 'lanterns' && (
              <section className="sanctuary-section">
                <div className="sanctuary-section-heading">
                  <Lamp size={19} aria-hidden="true" />
                  <div><h3>Lanterns for tonight</h3><p>Set down a thought, a hope, or nothing at all. Blank lanterns are welcome.</p></div>
                </div>
                <div className="starter-list" aria-label="Optional lantern prompts">
                  {LANTERN_PROMPTS.map((prompt) => (
                    <button key={prompt} type="button" className="starter-chip" onClick={() => setLanternContent((current) => current ? `${current}\n${prompt}` : prompt)}>{prompt}</button>
                  ))}
                </div>
                <form className="sanctuary-form" onSubmit={addLantern}>
                  <label>Optional thought
                    <textarea value={lanternContent} onChange={(event) => setLanternContent(event.target.value)} maxLength={1000} rows={3} placeholder="You can leave this blank…" />
                  </label>
                  <button type="submit" className="button-primary" disabled={!loaded || Boolean(error)}><Lamp size={15} /> Release a lantern</button>
                </form>
                <EntryList entries={data.lanterns} empty="No lanterns afloat yet." onDelete={(id) => removeEntry('lanterns', id)} />
              </section>
            )}

            {tab === 'keepsakes' && (
              <section className="sanctuary-section">
                <div className="sanctuary-section-heading">
                  <BookHeart size={19} aria-hidden="true" />
                  <div><h3>Tiny good things</h3><p>Keep a small memory, a link, or a detail you want to revisit.</p></div>
                </div>
                <form className="sanctuary-form" onSubmit={addKeepsake}>
                  <label>Title
                    <input value={keepsakeTitle} onChange={(event) => setKeepsakeTitle(event.target.value)} maxLength={100} placeholder="A song for rainy mornings" />
                  </label>
                  <label>Memory or note
                    <textarea value={keepsakeContent} onChange={(event) => setKeepsakeContent(event.target.value)} maxLength={3000} rows={3} placeholder="A few words to help you remember…" />
                  </label>
                  <label>Optional link
                    <input type="url" value={keepsakeLink} onChange={(event) => setKeepsakeLink(event.target.value)} maxLength={1000} placeholder="https://" />
                  </label>
                  <p className="sanctuary-disclosure">Text and links only; this corner does not upload photos or sync elsewhere.</p>
                  <button type="submit" className="button-primary" disabled={!loaded || Boolean(error)}><Check size={15} /> Keep this</button>
                </form>
                <EntryList entries={data.keepsakes.filter((entry) => !entry.kind)} empty="Nothing tucked away yet." onDelete={(id) => removeEntry('keepsakes', id)} />
              </section>
            )}

            {tab === 'shelf' && (
              <section className="sanctuary-section">
                <div className="sanctuary-section-heading">
                  <Library size={19} aria-hidden="true" />
                  <div><h3>Your Comfort Shelf</h3><p>Songs, photos, reassuring messages, favorite memories, or people you can contact when it is hard.</p></div>
                </div>
                <form className="sanctuary-form" onSubmit={addToComfortShelf}>
                  <label>What kind of comfort
                    <div className="comfort-kind-grid">
                      {COMFORT_KINDS.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`comfort-kind-pill ${shelfKind === item.id ? 'is-selected' : ''}`}
                            onClick={() => setShelfKind(item.id)}
                          >
                            <Icon size={14} aria-hidden="true" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </label>
                  <label>Title
                    <input value={shelfTitle} onChange={(event) => setShelfTitle(event.target.value)} maxLength={100} placeholder="A song that holds me" />
                  </label>
                  <label>Memory, message, or note
                    <textarea value={shelfContent} onChange={(event) => setShelfContent(event.target.value)} maxLength={3000} rows={3} placeholder="Write what you want to remember or say to yourself…" />
                  </label>
                  <label>Optional link
                    <input type="url" value={shelfLink} onChange={(event) => setShelfLink(event.target.value)} maxLength={1000} placeholder="https://" />
                  </label>
                  <label>Optional photo note (local only)
                    <input type="file" accept="image/*" onChange={(event) => handleImageUpload(event.target.files?.[0] ?? null)} />
                  </label>
                  {shelfImage && <img src={shelfImage} alt="Comfort shelf preview" className="comfort-shelf-preview" />}
                  <p className="sanctuary-disclosure">Stored only on this device. Nothing is uploaded. For people/contact entries, you choose what details to include.</p>
                  <button type="submit" className="button-primary" disabled={!loaded || Boolean(error)}><HeartHandshake size={15} /> Add to shelf</button>
                </form>
                <ul className="private-entry-list">
                  {data.keepsakes.filter((entry) => entry.kind).length === 0 && <p className="sanctuary-empty">No comfort tucked away yet. Add something for a hard moment.</p>}
                  {data.keepsakes
                    .filter((entry) => entry.kind)
                    .map((entry) => (
                      <li key={entry.id}>
                        <div>
                          <h4>
                            {entry.kind ? `${COMFORT_KINDS.find((item) => item.id === entry.kind)?.label ?? 'Comfort'} — ` : ''}
                            {entry.title}
                          </h4>
                          {entry.content && <p>{entry.content}</p>}
                          {entry.link && (
                            <a href={entry.link} target="_blank" rel="noopener noreferrer" className="comfort-shelf-link">
                              Open link <span aria-hidden="true">↗</span>
                            </a>
                          )}
                          {entry.imageData && <img src={entry.imageData} alt={entry.title} className="comfort-shelf-thumb" />}
                        </div>
                        <div className="private-entry-actions">
                          <button type="button" className="button-quiet" onClick={() => removeEntry('keepsakes', entry.id)} aria-label={`Delete ${entry.title}`}><X size={15} /></button>
                        </div>
                      </li>
                    ))}
                </ul>
              </section>
            )}

            {tab === 'words' && (
              <section className="sanctuary-section">
                <div className="sanctuary-section-heading">
                  <MessageCircleHeart size={19} aria-hidden="true" />
                  <div><h3>A few words, if you want them</h3><p>Original in-app writing, not messages submitted by visitors.</p></div>
                </div>
                <ul className="sanctuary-message-list">
                  {MESSAGE_LIBRARY.map((message) => <li key={message}><CloudMoon size={17} aria-hidden="true" /><p>{message}</p></li>)}
                </ul>
                <p className="sanctuary-disclosure">These are gentle words from the game, not professional advice or a substitute for support from someone you trust.</p>
              </section>
            )}

            {tab === 'support' && (
              <section className="sanctuary-section">
                <div className="sanctuary-section-heading">
                  <Heart size={19} aria-hidden="true" />
                  <div><h3>Support beyond this rooftop</h3><p>You deserve support from real people, too. You choose whether to reach out.</p></div>
                </div>
                <div className="support-card">
                  <h4>Find a helpline in your country</h4>
                  <p>Find A Helpline is an independent directory. Its listings and availability may change; choose your location on their site.</p>
                  <a href="https://findahelpline.com/" target="_blank" rel="noopener noreferrer">Visit Find A Helpline <span aria-hidden="true">↗</span></a>
                </div>
                <div className="support-card">
                  <h4>Someone you trust</h4>
                  <p>If it feels possible, you might contact a trusted friend, family member, or local support professional and tell them what would help right now.</p>
                </div>
                <p className="sanctuary-emergency">If you or someone else is in immediate danger, contact local emergency services or go to the nearest emergency department. This app is not monitored and cannot provide emergency help.</p>
              </section>
            )}

            {tab === 'privacy' && (
              <section className="sanctuary-section">
                <div className="sanctuary-section-heading">
                  <LockKeyhole size={19} aria-hidden="true" />
                  <div><h3>Your private notes stay on this device</h3><p>They are stored in this browser's local storage, separate from rooftop discoveries.</p></div>
                </div>
                <p className="sanctuary-disclosure">This app does not send these notes to a server. Anyone with access to this browser profile may be able to view them; local storage is not encrypted. Clearing browser data can also remove them.</p>
                <dl className="private-counts">
                  <div><dt>Letters</dt><dd>{data.letters.length}</dd></div>
                  <div><dt>Lanterns</dt><dd>{data.lanterns.length}</dd></div>
                  <div><dt>Tiny good things</dt><dd>{data.keepsakes.filter((entry) => !entry.kind).length}</dd></div>
                  <div><dt>Comfort shelf</dt><dd>{data.keepsakes.filter((entry) => entry.kind).length}</dd></div>
                </dl>
                <div className="sanctuary-actions" style={{ justifyContent: 'flex-start' }}>
                  <button type="button" className="button-quiet" onClick={exportAll}><Download size={15} /> Export as text</button>
                  <button type="button" className="button-quiet" onClick={copyForSelf}><Copy size={15} /> {copied ? 'Copied' : 'Copy for myself'}</button>
                </div>
                <p className="sanctuary-disclosure">Export copies letters, lanterns, and your comfort shelf to a text file on your device. No data is sent anywhere.</p>
                {!confirmDelete ? (
                <button type="button" className="button-danger-outline" onClick={() => setConfirmDelete(true)}><X size={15} /> Delete all private notes</button>
                ) : (
                  <div className="private-delete-confirm" role="alert">
                    <p>This permanently removes your letters, lanterns, and keepsakes from this browser. It will not reset your discoveries.</p>
                    <button type="button" className="button-danger" onClick={removeAllPrivateData}>Delete private notes</button>
                    <button type="button" className="button-quiet" onClick={() => setConfirmDelete(false)}>Keep them</button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
        {status && <p className={`sanctuary-status ${folding ? 'is-folding' : ''}`} role="status">{status}</p>}
      </div>
    </Modal>
  );
}

function EntryList({
  entries,
  empty,
  onDelete,
  onEdit,
}: {
  entries: PrivateEntry[];
  empty: string;
  onDelete: (id: string) => void;
  onEdit?: (entry: PrivateEntry) => void;
}) {
  if (entries.length === 0) return <p className="sanctuary-empty">{empty}</p>;
  return (
    <ul className="private-entry-list">
      {entries.map((entry) => (
        <li key={entry.id}>
          <div>
            <h4>{entry.title}</h4>
            <p>{entry.content || 'A blank lantern, carrying no words.'}</p>
            {entry.link && (
              <a href={entry.link} target="_blank" rel="noopener noreferrer" className="comfort-shelf-link">
                Open link <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
          <div className="private-entry-actions">
            {onEdit && <button type="button" className="button-quiet" onClick={() => onEdit(entry)}>Edit</button>}
            <button type="button" className="button-quiet" onClick={() => onDelete(entry.id)} aria-label={`Delete ${entry.title}`}><X size={15} /></button>
          </div>
        </li>
      ))}
    </ul>
  );
}
