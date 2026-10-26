import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function Modal({
  labelledBy,
  onClose,
  children,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    panel?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input, textarea, select',
    ).forEach((control) => {
      control.dataset.modalInitialValue = control.value;
      if (control instanceof HTMLInputElement && ['checkbox', 'radio'].includes(control.type)) {
        control.dataset.modalInitialChecked = String(control.checked);
      }
    });
    const initialFocus = panel?.querySelector<HTMLElement>(
      '[data-autofocus], .panel-close, button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    window.setTimeout(() => initialFocus?.focus(), 60);

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) =>
          element.getAttribute('aria-hidden') !== 'true' &&
          element.offsetParent !== null &&
          !element.hasAttribute('disabled'),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus({ preventScroll: true });
    };
  }, [onClose]);

  return createPortal(
    <div
      className="modal-layer"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={`modal-panel ${className ?? ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

interface PanelHeaderProps {
  eyebrow: string;
  title: string;
  titleId: string;
  onClose: () => void;
  closeLabel?: string;
  children?: ReactNode;
}

export function PanelHeader({
  eyebrow,
  title,
  titleId,
  onClose,
  closeLabel = 'Close',
  children,
}: PanelHeaderProps) {
  return (
    <header className="panel-header">
      <div className="panel-heading">
        <p className="panel-eyebrow">{eyebrow}</p>
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
      <button type="button" className="panel-close" onClick={onClose} aria-label={closeLabel}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6L6 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </header>
  );
}
