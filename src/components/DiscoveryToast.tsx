import { useEffect } from 'react';
import { Cat, Compass, Flower2, Sparkles, Star, Telescope, X } from 'lucide-react';
import type { DiscoveryNotice } from '../types/world';

interface DiscoveryToastProps {
  notice: DiscoveryNotice;
  onDismiss: () => void;
}

const KIND_LABEL: Record<DiscoveryNotice['kind'], string> = {
  celestial: 'Sky keepsake found',
  constellation: 'Constellation named',
  hidden: 'Rooftop secret found',
  'cat-reaction': 'A new mood',
  unlock: 'Something unlocked',
  whisper: 'The rooftop whispers',
  island: 'A little world visited',
  garden: 'The garden grows',
};

function NoticeIcon({ kind }: { kind: DiscoveryNotice['kind'] }) {
  switch (kind) {
    case 'celestial':
      return <Star size={18} strokeWidth={1.5} aria-hidden="true" />;
    case 'constellation':
      return <Telescope size={18} strokeWidth={1.5} aria-hidden="true" />;
    case 'hidden':
      return <Sparkles size={18} strokeWidth={1.5} aria-hidden="true" />;
    case 'cat-reaction':
      return <Cat size={18} strokeWidth={1.5} aria-hidden="true" />;
    case 'unlock':
      return <Flower2 size={18} strokeWidth={1.5} aria-hidden="true" />;
    case 'island':
      return <Compass size={18} strokeWidth={1.5} aria-hidden="true" />;
    case 'garden':
      return <Flower2 size={18} strokeWidth={1.5} aria-hidden="true" />;
    default:
      return <Sparkles size={18} strokeWidth={1.5} aria-hidden="true" />;
  }
}

export function DiscoveryToast({ notice, onDismiss }: DiscoveryToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 7200);
    return () => window.clearTimeout(timer);
  }, [notice.id, onDismiss]);

  return (
    <div className={`discovery-toast notice-${notice.kind}`} role="status" aria-live="polite" aria-atomic="true">
      <div className="toast-icon" aria-hidden="true">
        <NoticeIcon kind={notice.kind} />
      </div>
      <div className="toast-copy">
        <p className="toast-kicker">{KIND_LABEL[notice.kind]}</p>
        <h3>{notice.subtitle}</h3>
        <p>{notice.body}</p>
      </div>
      <button type="button" className="toast-close" onClick={onDismiss} aria-label="Dismiss discovery">
        <X size={15} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <span className="toast-progress" aria-hidden="true" />
    </div>
  );
}
