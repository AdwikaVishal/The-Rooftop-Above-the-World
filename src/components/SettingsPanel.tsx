import { useState } from 'react';
import {
  Cat,
  Flower2,
  Keyboard,
  Lamp,
  RotateCcw,
  Sparkles,
  Telescope,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { TOTAL_DISCOVERIES } from '../game/systems/DiscoverySystem';
import { Modal, PanelHeader } from './Modal';

interface SettingsPanelProps {
  total: number;
  soundOn: boolean;
  reducedMotion: boolean;
  onToggleSound: () => void;
  onReset: () => void;
  onClose: () => void;
}

export function SettingsPanel({
  total,
  soundOn,
  reducedMotion,
  onToggleSound,
  onReset,
  onClose,
}: SettingsPanelProps) {
  const [confirming, setConfirming] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleReset = (): void => {
    onReset();
    setConfirming(false);
    setResetDone(true);
  };

  return (
    <Modal labelledBy="guide-title" onClose={onClose} className="guide-panel">
      <PanelHeader
        eyebrow="A quiet companion"
        title="Guide & Settings"
        titleId="guide-title"
        onClose={onClose}
        closeLabel="Close guide"
      >
        <p className="panel-intro">
          There is no wrong way to be here. The rooftop rewards attention more than hurry.
        </p>
      </PanelHeader>

      <div
        className="guide-scroll"
        role="region"
        aria-label="Guide and settings"
        tabIndex={0}
      >
        <section className="guide-section" aria-labelledby="guide-wander">
          <h3 id="guide-wander">
            <Sparkles size={17} strokeWidth={1.5} aria-hidden="true" />
            How to wander
          </h3>
          <ul className="guide-list">
            <li>
              <Cat size={17} strokeWidth={1.5} aria-hidden="true" />
              <span>
                <strong>Visit Whisker.</strong> Pet the cat more than once. He has several moods,
                and he is not in a hurry to show them all.
              </span>
            </li>
            <li>
              <Flower2 size={17} strokeWidth={1.5} aria-hidden="true" />
              <span>
                <strong>Touch the growing things.</strong> Three plants live here. Curious
                fingers make them shimmer.
              </span>
            </li>
            <li>
              <Telescope size={17} strokeWidth={1.5} aria-hidden="true" />
              <span>
                <strong>Use the telescope.</strong> Three old constellations are hiding in the
                dark. A knot of light is worth a closer look.
              </span>
            </li>
            <li>
              <Lamp size={17} strokeWidth={1.5} aria-hidden="true" />
              <span>
                <strong>Turn the lanterns down.</strong> Some things prefer the dark. You can
                toggle the lights here or by clicking a hanging lantern.
              </span>
            </li>
            <li>
              <Sparkles size={17} strokeWidth={1.5} aria-hidden="true" />
              <span>
                <strong>Look closely at corners.</strong> Five small secrets are tucked into the
                rooftop. Their glints are shy, not invisible.
              </span>
            </li>
          </ul>
        </section>

        <section className="guide-section" aria-labelledby="guide-keys">
          <h3 id="guide-keys">
            <Keyboard size={17} strokeWidth={1.5} aria-hidden="true" />
            Keyboard shortcuts
          </h3>
          <dl className="shortcut-list">
            <div>
              <dt>Journal</dt>
              <dd>
                <kbd>J</kbd>
              </dd>
            </div>
            <div>
              <dt>Customize</dt>
              <dd>
                <kbd>C</kbd>
              </dd>
            </div>
            <div>
              <dt>Guide</dt>
              <dd>
                <kbd>H</kbd>
              </dd>
            </div>
            <div>
              <dt>Telescope</dt>
              <dd>
                <kbd>T</kbd>
              </dd>
            </div>
            <div>
              <dt>Lanterns</dt>
              <dd>
                <kbd>L</kbd>
              </dd>
            </div>
            <div>
              <dt>Sound</dt>
              <dd>
                <kbd>M</kbd>
              </dd>
            </div>
            <div>
              <dt>Close a panel</dt>
              <dd>
                <kbd>Esc</kbd>
              </dd>
            </div>
          </dl>
        </section>

        <section className="guide-section settings-row" aria-labelledby="guide-sound">
          <div>
            <h3 id="guide-sound">Rooftop sound</h3>
            <p>
              Soft wind, distant chimes, an occasional purr. Sound begins only when you ask for
              it, and it is off by default.
            </p>
          </div>
          <button
            type="button"
            className={`switch-button ${soundOn ? 'is-on' : ''}`}
            aria-pressed={soundOn}
            onClick={onToggleSound}
          >
            {soundOn ? (
              <Volume2 size={16} strokeWidth={1.6} aria-hidden="true" />
            ) : (
              <VolumeX size={16} strokeWidth={1.6} aria-hidden="true" />
            )}
            {soundOn ? 'Sound on' : 'Sound off'}
          </button>
        </section>

        <section className="guide-section settings-row" aria-labelledby="guide-motion">
          <div>
            <h3 id="guide-motion">Motion</h3>
            <p>
              The rooftop follows your system&rsquo;s reduced-motion setting. It is currently{' '}
              <strong>{reducedMotion ? 'calmed' : 'gently alive'}</strong>.
            </p>
          </div>
          <span className={`motion-badge ${reducedMotion ? 'is-calm' : ''}`}>
            {reducedMotion ? 'Reduced motion' : 'Ambient motion'}
          </span>
        </section>

        <section className="guide-section danger-zone" aria-labelledby="guide-reset">
          <h3 id="guide-reset">
            <RotateCcw size={17} strokeWidth={1.5} aria-hidden="true" />
            Begin again
          </h3>
          <p>
            You have noticed <strong>{total}</strong> of {TOTAL_DISCOVERIES} small wonders. Reset
            forgets every discovery, unlocked decoration, and chosen arrangement on this device.
          </p>

          {resetDone ? (
            <p className="reset-done" role="status">
              The rooftop is new again. It looks forward to meeting you.
            </p>
          ) : confirming ? (
            <div className="reset-confirm" role="alert">
              <p>This cannot be undone. Are you sure you want to forget everything?</p>
              <div className="reset-actions">
                <button type="button" className="button-quiet" onClick={() => setConfirming(false)}>
                  Keep my memories
                </button>
                <button type="button" className="button-danger" onClick={handleReset}>
                  Yes, begin again
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="button-danger-outline" onClick={() => setConfirming(true)}>
              Reset the rooftop
            </button>
          )}
        </section>

        <footer className="guide-footer">
          No account. No hurry. Your visits are remembered only on this device.
        </footer>
      </div>
    </Modal>
  );
}
