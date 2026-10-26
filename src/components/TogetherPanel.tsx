import { useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Feather,
  Flower2,
  Gift,
  HeartHandshake,
  Lamp,
  Link2,
  Mail,
  NotebookPen,
  Send,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  addGardenItem,
  addSharedPostcard,
  buildShareLink,
  clearIncomingShareCode,
  createSharedGarden,
  decodeShareCode,
  deleteSharedGarden,
  encodeShareCode,
  itemKindLabel,
  loadSharedGarden,
  mergeSharedGardens,
  readIncomingShareCode,
  saveSharedGarden,
  type SharedGarden,
  type SharedGardenItemKind,
} from '../services/togetherService';
import { Modal, PanelHeader } from './Modal';

interface TogetherPanelProps {
  onClose: () => void;
}

const ITEM_KINDS: readonly { id: SharedGardenItemKind; label: string; icon: typeof Flower2 }[] = [
  { id: 'flower', label: 'Plant a flower', icon: Flower2 },
  { id: 'lantern', label: 'Light a lantern', icon: Lamp },
  { id: 'note', label: 'Leave a note', icon: NotebookPen },
  { id: 'decoration', label: 'Add a tiny decoration', icon: Sparkles },
];

function formatTime(value: number): string {
  return new Date(value).toLocaleString();
}

export function TogetherPanel({ onClose }: TogetherPanelProps) {
  const [garden, setGarden] = useState<SharedGarden | null>(() => loadSharedGarden());
  const [step, setStep] = useState<'start' | 'garden'>(garden ? 'garden' : 'start');
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [incomingCode] = useState<string | null>(() => readIncomingShareCode());
  const [joinGarden, setJoinGarden] = useState<SharedGarden | null>(null);
  const [joinError, setJoinError] = useState('');
  const [itemKind, setItemKind] = useState<SharedGardenItemKind>('flower');
  const [itemNote, setItemNote] = useState('');
  const [postcardFrom, setPostcardFrom] = useState('');
  const [postcardMessage, setPostcardMessage] = useState('');
  const [yourName, setYourName] = useState('');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!incomingCode) return;
    const decoded = decodeShareCode(incomingCode);
    if (decoded) {
      setJoinGarden(decoded);
      setJoinError('');
    } else {
      setJoinError('That share link looks damaged. You can ask for a new one.');
    }
    clearIncomingShareCode();
  }, [incomingCode]);

  const shareCode = useMemo(() => (garden ? encodeShareCode(garden) : ''), [garden]);
  const shareLink = useMemo(() => (shareCode ? buildShareLink(shareCode) : ''), [shareCode]);

  const createGarden = (): void => {
    const created = createSharedGarden({ name: name.trim() || 'Our little rooftop', owner: owner.trim() || 'Someone' });
    setGarden(created);
    saveSharedGarden(created);
    setStep('garden');
    setStatus('Shared rooftop created. Share the link with just one trusted person.');
  };

  const join = (): void => {
    if (!joinGarden) return;
    const merged = mergeSharedGardens(garden, joinGarden);
    setGarden(merged);
    saveSharedGarden(merged);
    setJoinGarden(null);
    setStep('garden');
    setStatus('Joined your shared rooftop. It remembers both sides.');
  };

  const keepLocal = (): void => {
    if (!joinGarden) return;
    setGarden(joinGarden);
    saveSharedGarden(joinGarden);
    setJoinGarden(null);
    setStep('garden');
    setStatus('This shared rooftop is now saved on this device.');
  };

  const plant = (): void => {
    if (!garden) return;
    const from = yourName.trim() || garden.owner || 'Someone';
    const next = addGardenItem(garden, { kind: itemKind, note: itemNote, from });
    setGarden(next);
    saveSharedGarden(next);
    setItemNote('');
    setStatus('Added to your shared rooftop.');
  };

  const sendPostcard = (): void => {
    if (!garden) return;
    const from = postcardFrom.trim() || yourName.trim() || 'Someone';
    const next = addSharedPostcard(garden, { message: postcardMessage, from });
    setGarden(next);
    saveSharedGarden(next);
    setPostcardMessage('');
    setStatus('Postcard left in the shared garden.');
  };

  const copy = async (value: string): Promise<void> => {
    try {
      await navigator.clipboard?.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setStatus('Could not copy right now.');
    }
  };

  const leave = (): void => {
    deleteSharedGarden();
    setGarden(null);
    setStep('start');
    setStatus('Shared rooftop removed from this device.');
  };

  const sync = (): void => {
    if (!garden) return;
    if (joinGarden) {
      const merged = mergeSharedGardens(garden, joinGarden);
      setGarden(merged);
      saveSharedGarden(merged);
      setJoinGarden(null);
      setStatus('Merged with the shared copy.');
      return;
    }
    setStatus('Share your code/link with your friend. When they open it, you can merge both sides.');
  };

  return (
    <Modal labelledBy="together-title" onClose={onClose} className="together-panel">
      <PanelHeader
        eyebrow="Rooftops together"
        title="A tiny shared garden"
        titleId="together-title"
        onClose={onClose}
        closeLabel="Close together"
      >
        <p className="panel-intro">
          Two friends, one small floating garden. No endless chat feed. No follower counts. Just a place to leave something small.
        </p>
      </PanelHeader>

      <div className="together-scroll">
        {step === 'start' && (
          <section className="together-section">
            <div className="together-start-hero">
              <div className="together-garden-preview" aria-hidden="true">
                <span className="preview-moon"><Sparkles size={16} /></span>
                <span className="preview-flower"><Flower2 size={25} /></span>
                <span className="preview-lantern"><Lamp size={19} /></span>
                <span className="preview-cloud"><Users size={16} /></span>
              </div>
              <div className="together-hero">
                <p className="together-kicker">A small place for two</p>
                <h3>Make a little shared space</h3>
                <p>Create a private invitation for one trusted person. Share it however you usually would.</p>
              </div>
            </div>
            {joinGarden && (
              <div className="together-invite">
                <div>
                  <h4>Someone shared a rooftop with you</h4>
                  <p>
                    <strong>{joinGarden.name}</strong> — created by {joinGarden.owner}. {joinGarden.items.length} things and {joinGarden.postcards.length} postcards so far.
                  </p>
                </div>
                <div className="together-actions">
                  <button type="button" className="together-primary" onClick={join}>
                    <HeartHandshake size={16} /> Join and merge
                  </button>
                  <button type="button" className="together-quiet" onClick={keepLocal}>
                    Save this copy here
                  </button>
                  <button type="button" className="together-quiet" onClick={() => setJoinGarden(null)}>
                    Dismiss
                  </button>
                </div>
              </div>
            )}
            {joinError && <p className="together-error">{joinError}</p>}
            <div className="together-create-grid">
              <label>
                Shared garden name
                <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="Our little rooftop" />
              </label>
              <label>
                Your name (optional)
                <input value={owner} onChange={(event) => setOwner(event.target.value)} maxLength={40} placeholder="Someone" />
              </label>
            </div>
            <div className="together-actions">
              <button type="button" className="together-primary" onClick={createGarden}>
                <Sparkles size={16} /> Create shared rooftop
              </button>
              <button type="button" className="together-quiet" onClick={onClose}>
                Go back to roof
              </button>
            </div>
            <p className="together-disclosure">Shared gardens are stored only on devices that save them. There is no public listing. Keep your share code safe and only send it to people you trust.</p>
          </section>
        )}

        {step === 'garden' && garden && (
          <>
            <section className="together-section">
              <div className="together-header-row">
                <div>
                  <p className="together-kicker">Shared rooftop garden for two</p>
                  <h3>{garden.name}</h3>
                  <p>Created by {garden.owner} · Last updated {formatTime(garden.updatedAt)}</p>
                </div>
                <div className="together-actions">
                  <button type="button" className="together-quiet" onClick={sync}>
                    <Share2 size={16} /> Sync / merge
                  </button>
                  <button type="button" className="together-quiet" onClick={leave}>
                    Remove from this device
                  </button>
                </div>
              </div>
              <div className="together-share">
                <div>
                  <h4>Invite your friend</h4>
                  <p>Share this link or code. Opening it lets them join and merge both copies.</p>
                </div>
                <div className="together-share-row">
                  <input aria-label="Shared garden invitation link" value={shareLink} readOnly />
                  <button type="button" className="together-primary" onClick={() => copy(shareLink)}>
                    <Copy size={15} /> {copied ? 'Copied' : 'Copy link'}
                  </button>
                </div>
                <details className="together-code">
                  <summary>Show share code</summary>
                  <div className="together-share-row">
                    <input aria-label="Shared garden invitation code" value={shareCode} readOnly />
                    <button type="button" className="together-quiet" onClick={() => copy(shareCode)}>
                      <Link2 size={15} /> Copy code
                    </button>
                  </div>
                </details>
              </div>
            </section>

            <section className="together-section">
              <div className="together-section-head">
                <div>
                  <h3>Plant something small</h3>
                  <p>Leave a flower, lantern, note, or decoration. No pressure to reply immediately.</p>
                </div>
                <label className="together-name">
                  Your name
                  <input value={yourName} onChange={(event) => setYourName(event.target.value)} maxLength={40} placeholder="You" />
                </label>
              </div>
              <div className="together-kind-grid">
                {ITEM_KINDS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`together-kind-pill ${itemKind === item.id ? 'is-selected' : ''}`}
                      onClick={() => setItemKind(item.id)}
                    >
                      <Icon size={14} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="together-form-row">
                <input aria-label="Message for the shared garden" value={itemNote} onChange={(event) => setItemNote(event.target.value)} maxLength={500} placeholder="What would you like to leave here?" />
                <button type="button" className="together-primary" onClick={plant}>
                  <Feather size={16} /> Leave it
                </button>
              </div>
            </section>

            <section className="together-section">
              <div className="together-section-head">
                <div>
                  <h3>The shared garden</h3>
                  <p>Things left over time, glowing gently between two rooftops.</p>
                </div>
              </div>
              {garden.items.length === 0 ? (
                <p className="together-empty">Nothing has been planted yet. Leave a flower for them, whenever it feels right.</p>
              ) : (
                <ul className="together-list">
                  {garden.items.map((item) => (
                    <li key={item.id}>
                      <div className="together-list-icon">
                        {item.kind === 'flower' && <Flower2 size={16} />}
                        {item.kind === 'lantern' && <Lamp size={16} />}
                        {item.kind === 'note' && <NotebookPen size={16} />}
                        {item.kind === 'decoration' && <Sparkles size={16} />}
                      </div>
                      <div>
                        <p className="together-list-kicker">{itemKindLabel(item.kind)} · {item.from}</p>
                        <p className="together-list-body">{item.note}</p>
                        <p className="together-list-time">{formatTime(item.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="together-section">
              <div className="together-section-head">
                <div>
                  <h3>Postcards</h3>
                  <p>Send a little postcard to each other. Keep it short and kind.</p>
                </div>
                <label className="together-name">
                  From
                  <input value={postcardFrom} onChange={(event) => setPostcardFrom(event.target.value)} maxLength={40} placeholder="You" />
                </label>
              </div>
              <div className="together-form-row">
                <input aria-label="Postcard message" value={postcardMessage} onChange={(event) => setPostcardMessage(event.target.value)} maxLength={400} placeholder="Thinking of you tonight..." />
                <button type="button" className="together-primary" onClick={sendPostcard}>
                  <Mail size={16} /> Send postcard
                </button>
              </div>
              {garden.postcards.length === 0 ? (
                <p className="together-empty">No postcards yet.</p>
              ) : (
                <ul className="together-postcard-list">
                  {garden.postcards.map((postcard) => (
                    <li key={postcard.id}>
                      <div className="together-postcard-header">
                        <Send size={16} />
                        <span>Postcard from {postcard.from}</span>
                      </div>
                      <p>{postcard.message}</p>
                      <p className="together-list-time">{formatTime(postcard.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {joinGarden && (
              <section className="together-section">
                <div className="together-invite">
                  <div>
                    <h4>Another copy found</h4>
                    <p>There is another copy of this garden on this device or in the link. Merge to combine everything.</p>
                  </div>
                  <div className="together-actions">
                    <button type="button" className="together-primary" onClick={sync}>
                      <Gift size={16} /> Merge both copies
                    </button>
                    <button type="button" className="together-quiet" onClick={() => setJoinGarden(null)}>
                      Keep separate for now
                    </button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
        {status && <p className="together-status" role="status" aria-live="polite">{status}</p>}
      </div>
    </Modal>
  );
}
