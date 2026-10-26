import { useMemo, useState } from 'react';
import { ArrowLeft, Eye, Lock, Sparkles, Telescope } from 'lucide-react';
import { CONSTELLATIONS, isValidTraceStep, matchesConstellationTrace } from '../data/constellations';
import type { ConstellationId, WorldState } from '../types/world';
import { ConstellationFigure } from './ConstellationFigure';
import { Modal } from './Modal';

interface TelescopeViewProps {
  state: WorldState;
  reducedMotion: boolean;
  onFound: (id: ConstellationId) => void;
  onClose: () => void;
}

function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

const BACKGROUND_STARS = (() => {
  const random = seededRandom(86);
  return Array.from({ length: 150 }, (_, index) => ({
    id: index,
    x: random() * 100,
    y: random() * 100,
    size: 0.4 + random() * 1.7,
    opacity: 0.16 + random() * 0.55,
    delay: random() * 8,
    duration: 5 + random() * 8,
  }));
})();

function skyPosition(index: number): { left: string; top: string } {
  const spots = [
    { left: '26%', top: '27%' },
    { left: '67%', top: '34%' },
    { left: '49%', top: '65%' },
  ];
  return spots[index] ?? { left: '50%', top: '50%' };
}

export function TelescopeView({
  state,
  reducedMotion,
  onFound,
  onClose,
}: TelescopeViewProps) {
  const [selectedId, setSelectedId] = useState<ConstellationId | null>(null);
  const [trace, setTrace] = useState<number[]>([]);
  const [traceError, setTraceError] = useState(false);
  const [justNamed, setJustNamed] = useState(false);

  const selected = useMemo(
    () => CONSTELLATIONS.find((constellation) => constellation.id === selectedId) ?? null,
    [selectedId],
  );
  const selectedFound = selected ? state.constellations.includes(selected.id) : false;
  const namedCount = state.constellations.length;

  const openConstellation = (id: ConstellationId): void => {
    setSelectedId(id);
    setTrace([]);
    setTraceError(false);
    setJustNamed(false);
  };

  const returnToSky = (): void => {
    setSelectedId(null);
    setTrace([]);
    setTraceError(false);
  };

  const selectStar = (index: number): void => {
    if (!selected || selectedFound || justNamed) return;
    if (!isValidTraceStep(selected, trace, index)) {
      setTrace(index === selected.trace[0] ? [index] : []);
      setTraceError(true);
      return;
    }

    const next = [...trace, index];
    setTrace(next);
    setTraceError(false);
    if (matchesConstellationTrace(selected, next)) {
      onFound(selected.id);
      setJustNamed(true);
    }
  };

  return (
    <Modal labelledBy="telescope-title" onClose={onClose} className="telescope-panel">
      <header className="telescope-topbar">
        <div className="telescope-title-wrap">
          <span className="telescope-mark" aria-hidden="true">
            <Telescope size={20} strokeWidth={1.5} />
          </span>
          <div>
            <p className="panel-eyebrow">The old brass telescope</p>
            <h2 id="telescope-title">
              {selected ? (selectedFound ? selected.name : 'A knot of light') : 'The sky, up close'}
            </h2>
          </div>
        </div>
        <div className="telescope-actions">
          <span
            className="telescope-count"
            aria-label={`${namedCount} of ${CONSTELLATIONS.length} constellations named`}
          >
            {namedCount}/{CONSTELLATIONS.length} named
          </span>
          <button type="button" className="panel-close" onClick={onClose} aria-label="Leave the telescope">
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
        </div>
      </header>

      <div className={`telescope-sky ${selected ? 'is-focused' : ''}`}>
        <div className="sky-vignette" aria-hidden="true" />
        <div className="telescope-reticle" aria-hidden="true">
          <span />
          <span />
        </div>

        <div className="sky-stars" aria-hidden="true">
          {BACKGROUND_STARS.map((star) => (
            <span
              key={star.id}
              className="background-star"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animationDelay: `${star.delay}s`,
                animationDuration: `${star.duration}s`,
              }}
            />
          ))}
        </div>

        {!selected && (
          <div className="sky-map" aria-label="Constellations visible tonight">
            {CONSTELLATIONS.map((constellation, index) => {
              const found = state.constellations.includes(constellation.id);
              return (
                <button
                  key={constellation.id}
                  type="button"
                  className={`sky-constellation-button ${found ? 'is-found' : 'is-unfound'}`}
                  style={skyPosition(index)}
                  onClick={() => openConstellation(constellation.id)}
                  aria-label={
                    found
                      ? `Open the story of ${constellation.name}`
                      : `Inspect a faint constellation at position ${index + 1} of 3`
                  }
                >
                  <span className="focus-ring" aria-hidden="true" />
                  <ConstellationFigure
                    constellation={constellation}
                    discovered={found}
                    decorative
                    className="sky-constellation-art"
                  />
                  <span className="sky-constellation-label">
                    {found ? constellation.name : 'Faint lights'}
                    {!found && <span className="tiny-lock" aria-hidden="true"><Lock size={10} /></span>}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {selected && (
          <div
            className="telescope-focus"
            role="region"
            aria-label="Constellation observation"
            tabIndex={0}
          >
            <button type="button" className="sky-back" onClick={returnToSky}>
              <ArrowLeft size={15} strokeWidth={1.6} aria-hidden="true" />
              Back to the sky
            </button>

            <div className="focus-figure-wrap" style={{ color: selected.accent }}>
              <span className="focus-aura" aria-hidden="true" />
              {selectedFound ? (
                <ConstellationFigure
                  constellation={selected}
                  discovered
                  className={`focus-constellation ${justNamed && !reducedMotion ? 'trace-success' : ''}`}
                />
              ) : (
                <svg
                  viewBox="0 0 100 100"
                  className="focus-constellation trace-canvas"
                  role="group"
                  aria-label={`Trace the stars for ${selected.subtitle}`}
                >
                  <defs>
                    <radialGradient id="trace-wash">
                      <stop offset="0%" stopColor={selected.accent} stopOpacity="0.12" />
                      <stop offset="100%" stopColor={selected.accent} stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <circle cx="50" cy="50" r="48" fill="url(#trace-wash)" />
                  {trace.slice(1).map((starIndex, index) => {
                    const from = selected.points[trace[index] ?? -1];
                    const to = selected.points[starIndex];
                    if (!from || !to) return null;
                    return (
                      <line
                        key={`${trace[index]}-${starIndex}-${index}`}
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        className="trace-line"
                        stroke={selected.accent}
                      />
                    );
                  })}
                  {selected.points.map((point, index) => {
                    const isNext = index === selected.trace[trace.length];
                    const isTraced = trace.includes(index);
                    return (
                      <g
                        key={index}
                        className={`trace-star ${isTraced ? 'is-traced' : ''} ${isNext && trace.length === 0 ? 'is-first-hint' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-label={`Star ${index + 1}${isTraced ? ', connected' : ''}`}
                        onClick={() => selectStar(index)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            selectStar(index);
                          }
                        }}
                      >
                        <circle cx={point.x} cy={point.y} r="6" className="trace-star-hit" />
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={(point.size ?? 2) * 0.9}
                          className="trace-star-core"
                          fill={selected.accent}
                        />
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>

            <div className="focus-copy">
              <p className="panel-eyebrow">
                {selectedFound ? 'A constellation you named' : 'A pattern in the dark'}
              </p>
              <h3 id="telescope-focus-title">
                {selectedFound ? selected.name : 'It is waiting to be named'}
              </h3>
              <p className="focus-story">
                {selectedFound
                  ? selected.story
                  : `${selected.whisper} The stars keep their shape until someone is patient enough to see it.`}
              </p>

              {selectedFound ? (
                <p className="focus-note">
                  <Sparkles size={14} strokeWidth={1.5} aria-hidden="true" />
                  The rooftop keeps this name in your journal.
                </p>
              ) : (
                <>
                  <p className="trace-guidance" aria-live="polite">
                    {traceError
                      ? 'That light belongs elsewhere. Take a breath and begin again.'
                      : trace.length === 0
                        ? 'Choose the quiet, steady light to begin.'
                        : `${trace.length} of the faint connections traced.`}
                  </p>
                  <p className="trace-count" aria-label={`${trace.length} trace steps completed`}>
                    {trace.length} / {selected.trace.length} steps
                  </p>
                  <button
                    type="button"
                    className="button-primary focus-name-button"
                    onClick={() => {
                      setTrace([]);
                      setTraceError(false);
                    }}
                    disabled={trace.length === 0}
                  >
                    <Eye size={17} strokeWidth={1.7} aria-hidden="true" />
                    Begin the trace again
                  </button>
                </>
              )}

              {justNamed && (
                <p className="focus-just-named" role="status">
                  <Sparkles size={14} strokeWidth={1.6} aria-hidden="true" />
                  You named it. The stars seem a little less far away.
                </p>
              )}
            </div>
          </div>
        )}

        <p className="telescope-footnote">
          {selected
            ? 'Move slowly. The sky is not going anywhere.'
            : `${CONSTELLATIONS.length - namedCount} quiet patterns are still unnamed.`}
        </p>
      </div>
    </Modal>
  );
}
