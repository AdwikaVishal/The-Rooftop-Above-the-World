import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CloudMoon,
  CloudRain,
  Feather,
  Flower2,
  Heart,
  MoonStar,
  Play,
  Sparkles,
  Timer,
  X,
} from 'lucide-react';
import { ESCAPE_DURATIONS, ESCAPE_SCENES, type EscapeFeedback, type EscapeSceneId } from '../data/escape';
import { hasArrived, markArrived, recordEscapeFeedback, recordEscapeStart } from '../services/escapeService';
import { audioService } from '../services/audioService';

interface EscapeOverlayProps {
  open: boolean;
  forceOpen?: boolean;
  onClose: () => void;
  onSettleCat: () => void;
  onEnterQuietMode: () => void;
}

const ICONS: Record<EscapeSceneId, typeof CloudRain> = {
  rain: CloudRain,
  stars: MoonStar,
  garden: Flower2,
  whisker: Heart,
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function EscapeOverlay({ open, forceOpen = false, onClose, onSettleCat, onEnterQuietMode }: EscapeOverlayProps) {
  const [step, setStep] = useState<'arrive' | 'choose' | 'session' | 'feedback'>(forceOpen ? 'choose' : 'arrive');
  const [sceneId, setSceneId] = useState<EscapeSceneId>('stars');
  const [duration, setDuration] = useState<number>(300);
  const [remaining, setRemaining] = useState<number>(300);
  const [running, setRunning] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const timerRef = useRef<number | null>(null);
  const arrivedRef = useRef(false);

  const scene = useMemo(() => ESCAPE_SCENES.find((item) => item.id === sceneId)!, [sceneId]);
  const Icon = ICONS[sceneId];

  useEffect(() => {
    if (!open) {
      setStep(forceOpen ? 'choose' : 'arrive');
      setRunning(false);
      setFeedbackGiven(false);
      setPromptIndex(0);
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    if (forceOpen) {
      setStep('choose');
      arrivedRef.current = true;
      return;
    }
    const arrived = hasArrived();
    arrivedRef.current = arrived;
    setStep(arrived ? 'choose' : 'arrive');
    if (!arrived) markArrived();
  }, [open, forceOpen]);

  useEffect(() => {
    if (step !== 'session' || !running) {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          setRunning(false);
          window.clearInterval(timerRef.current!);
          timerRef.current = null;
          setStep('feedback');
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [step, running]);

  useEffect(() => {
    if (step !== 'session') return;
    const interval = window.setInterval(() => {
      setPromptIndex((index) => (index + 1) % scene.prompts.length);
    }, 9000);
    return () => window.clearInterval(interval);
  }, [step, scene.prompts.length]);

  const startSession = (): void => {
    setDuration(duration);
    setRemaining(duration);
    setPromptIndex(0);
    setRunning(true);
    setFeedbackGiven(false);
    recordEscapeStart(sceneId);
    setStep('session');
    if (soundOnAmbient()) audioService.chime('discovery');
  };

  const soundOnAmbient = (): boolean => {
    try {
      const ctx = (audioService as any).context;
      return ctx?.state === 'running';
    } catch {
      return false;
    }
  };

  const giveFeedback = (value: EscapeFeedback): void => {
    recordEscapeFeedback(value);
    setFeedbackGiven(true);
    setStep('choose');
  };

  const settleAndStay = (): void => {
    onSettleCat();
    onEnterQuietMode();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="escape-layer" role="dialog" aria-modal="true" aria-labelledby="escape-title">
      <div className="escape-backdrop" />
      <div className="escape-panel">
        <header className="escape-header">
          <div className="escape-heading">
            <p className="escape-eyebrow">5-minute escape</p>
            <h2 id="escape-title">{step === 'arrive' ? 'A little place to go' : 'The rooftop goes quiet for you'}</h2>
          </div>
          <button type="button" className="escape-close" onClick={onClose} aria-label="Close escape">
            <X size={18} />
          </button>
        </header>

        {step === 'arrive' && (
          <section className="escape-section">
            <div className="escape-hero">
              <MoonStar size={28} aria-hidden="true" />
              <h3>You can come here when the world feels too loud.</h3>
              <p>
                Pick a soft scene, take a minute or five, and follow gentle prompts. No streaks, no pressure to feel better.
                You can leave whenever you are ready.
              </p>
            </div>
            <div className="escape-actions">
              <button type="button" className="escape-primary" onClick={() => setStep('choose')}>
                <Feather size={16} /> I need somewhere quiet
              </button>
              <button type="button" className="escape-quiet" onClick={onClose}>
                Just explore for now
              </button>
            </div>
          </section>
        )}

        {step === 'choose' && (
          <section className="escape-section">
            <div className="escape-section-head">
              <div>
                <h3>Choose a scene</h3>
                <p>Pick what sounds gentle right now. You can change it any time.</p>
              </div>
              <div className="escape-duration">
                {ESCAPE_DURATIONS.map((item) => (
                  <button
                    key={item.seconds}
                    type="button"
                    className={`escape-pill ${duration === item.seconds ? 'is-selected' : ''}`}
                    onClick={() => setDuration(item.seconds)}
                  >
                    <Timer size={14} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="escape-scene-grid">
              {ESCAPE_SCENES.map((item) => {
                const SceneIcon = ICONS[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`escape-scene-card ${sceneId === item.id ? 'is-selected' : ''}`}
                    onClick={() => setSceneId(item.id)}
                  >
                    <div className="escape-scene-icon">
                      <SceneIcon size={20} />
                    </div>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="escape-actions">
              <button type="button" className="escape-primary" onClick={startSession}>
                <Play size={16} /> Begin {formatTime(duration)}
              </button>
              <button type="button" className="escape-quiet" onClick={settleAndStay}>
                <Heart size={16} /> Settle in with Whisker
              </button>
              <button type="button" className="escape-quiet" onClick={onClose}>
                Return to roof
              </button>
            </div>
          </section>
        )}

        {step === 'session' && (
          <section className="escape-session">
            <div className="escape-session-sky">
              <div className="escape-session-vignette" />
              <div className="escape-session-moon" aria-hidden="true">
                <Icon size={32} />
              </div>
              <div className="escape-session-timer">
                <Timer size={16} />
                <span>{formatTime(remaining)}</span>
              </div>
            </div>
            <div className="escape-session-body">
              <p className="escape-session-kicker">{scene.title}</p>
              <p className="escape-session-prompt" key={promptIndex}>
                {scene.prompts[promptIndex]}
              </p>
              <div className="escape-session-actions">
                <button type="button" className="escape-quiet" onClick={() => setRunning((value) => !value)}>
                  {running ? 'Pause' : 'Resume'}
                </button>
                <button
                  type="button"
                  className="escape-quiet"
                  onClick={() => {
                    setRunning(false);
                    setStep('feedback');
                  }}
                >
                  I&rsquo;m ready to leave
                </button>
                <button type="button" className="escape-quiet" onClick={onClose}>
                  Close
                </button>
              </div>
              <p className="escape-session-footnote">There is no need to finish every prompt. Do only what feels kind.</p>
            </div>
          </section>
        )}

        {step === 'feedback' && (
          <section className="escape-section">
            <div className="escape-hero">
              <CloudMoon size={26} aria-hidden="true" />
              <h3>How was that for you?</h3>
              <p>This helps only here, on this device. No account. No pressure.</p>
            </div>
            <div className="escape-feedback-grid">
              <button type="button" className="escape-feedback-card" onClick={() => giveFeedback('helpful')} disabled={feedbackGiven}>
                <Sparkles size={18} /> Helpful
              </button>
              <button type="button" className="escape-feedback-card" onClick={() => giveFeedback('somewhat')} disabled={feedbackGiven}>
                <Feather size={18} /> Somewhat
              </button>
              <button type="button" className="escape-feedback-card" onClick={() => giveFeedback('not-really')} disabled={feedbackGiven}>
                <CloudMoon size={18} /> Not really
              </button>
            </div>
            <div className="escape-actions">
              <button type="button" className="escape-quiet" onClick={() => setStep('choose')}>
                Try another scene
              </button>
              <button type="button" className="escape-quiet" onClick={onClose}>
                Return to roof
              </button>
              <button type="button" className="escape-primary" onClick={settleAndStay}>
                <Heart size={16} /> Stay quietly with Whisker
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
