import { BookOpen, Cat, Compass, Lock, Sparkles, Telescope } from 'lucide-react';
import { CAT_REACTIONS } from '../data/catReactions';
import { CELESTIALS } from '../data/collectibles';
import { CONSTELLATIONS } from '../data/constellations';
import { HIDDEN_DISCOVERIES } from '../data/hidden';
import { DREAM_ISLANDS } from '../data/islands';
import { TOTAL_DISCOVERIES } from '../game/systems/DiscoverySystem';
import type { CatReactionId, IslandId, WorldState } from '../types/world';
import { ConstellationFigure } from './ConstellationFigure';
import { ItemGlyph, type GlyphName } from './ItemGlyph';
import { Modal, PanelHeader } from './Modal';

interface JournalPanelProps {
  state: WorldState;
  total: number;
  onClose: () => void;
}

const MOOD_GLYPHS: Record<CatReactionId, GlyphName> = {
  purr: 'purr',
  'slow-blink': 'blink',
  stretch: 'stretch',
  yawn: 'yawn',
  'tail-curl': 'tail',
};

const ISLAND_GLYPHS: Record<IslandId, GlyphName> = {
  'moon-garden': 'flower',
  'cloud-cottage': 'teacup',
  'little-observatory': 'orrery',
  'island-of-grief': 'moon',
  'island-of-change': 'comet',
  'island-of-belonging': 'woven',
  'island-of-rest': 'quilt',
  'island-of-hope': 'lantern',
};

function Progress({ found, total, label }: { found: number; total: number; label: string }) {
  const percentage = total === 0 ? 0 : (found / total) * 100;
  return (
    <div className="journal-progress">
      <div className="journal-progress-top">
        <span>{label}</span>{' '}
        <span>
          {found} / {total}
        </span>
      </div>
      <div
        className="journal-progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={found}
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function StatusPill({ found, label }: { found: boolean; label: string }) {
  return (
    <span className={`status-pill ${found ? 'found' : 'unfound'}`}>
      {found ? <Sparkles size={11} aria-hidden="true" /> : <Lock size={11} aria-hidden="true" />}
      {label}
    </span>
  );
}

export function JournalPanel({ state, total, onClose }: JournalPanelProps) {
  return (
    <Modal labelledBy="journal-title" onClose={onClose} className="journal-panel">
      <PanelHeader
        eyebrow="A small record"
        title="The Rooftop Journal"
        titleId="journal-title"
        onClose={onClose}
        closeLabel="Close journal"
      >
        <p className="panel-intro">
          Everything you notice is kept here, even after you close the window. The rooftop
          remembers.
        </p>
      </PanelHeader>

      <div className="journal-summary" aria-label="Discovery progress">
        <Progress found={total} total={TOTAL_DISCOVERIES} label="All small wonders" />
      </div>

      <div
        className="journal-scroll"
        role="region"
        aria-label="Journal entries"
        tabIndex={0}
      >
        <section className="journal-section" aria-labelledby="journal-sky">
          <div className="section-heading">
            <span className="section-icon" aria-hidden="true">
              <StarIcon />
            </span>
            <div>
              <h3 id="journal-sky">Sky keepsakes</h3>
              <p>Little pieces of the night that decided to stay.</p>
            </div>
          </div>
          <ul className="collection-grid">
            {CELESTIALS.map((item) => {
              const found = state.celestial.includes(item.id);
              return (
                <li key={item.id} className={`collection-card ${found ? 'is-found' : 'is-locked'}`}>
                  <div className="collection-art" aria-hidden="true">
                    <ItemGlyph glyph={item.glyph} size={36} />
                    {!found && (
                      <span className="art-lock">
                        <Lock size={13} />
                      </span>
                    )}
                  </div>
                  <div className="collection-copy">
                    <StatusPill found={found} label={found ? 'In your journal' : 'Undiscovered'} />
                    <h4>{found ? item.name : 'A hidden keepsake'}</h4>
                    <p>{found ? item.description : item.hint}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="journal-section" aria-labelledby="journal-constellations">
          <div className="section-heading">
            <span className="section-icon" aria-hidden="true">
              <Telescope size={19} strokeWidth={1.5} />
            </span>
            <div>
              <h3 id="journal-constellations">Constellations</h3>
              <p>Names the city has forgotten. The telescope remembers.</p>
            </div>
          </div>
          <ul className="collection-grid constellation-grid">
            {CONSTELLATIONS.map((item) => {
              const found = state.constellations.includes(item.id);
              return (
                <li key={item.id} className={`collection-card constellation-card ${found ? 'is-found' : 'is-locked'}`}>
                  <div
                    className="constellation-thumb"
                    aria-hidden="true"
                    style={{ color: item.accent }}
                  >
                    <ConstellationFigure
                      constellation={item}
                      discovered={found}
                      decorative
                      className="constellation-journal-svg"
                    />
                    {!found && (
                      <span className="art-lock">
                        <Lock size={13} />
                      </span>
                    )}
                  </div>
                  <div className="collection-copy">
                    <StatusPill found={found} label={found ? 'Named' : 'Unnamed'} />
                    <h4>{found ? item.name : 'An unnamed constellation'}</h4>
                    <p>
                      {found
                        ? item.story
                        : 'Visit the telescope and look for a knot of light that does not quite belong.'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="journal-section" aria-labelledby="journal-hidden">
          <div className="section-heading">
            <span className="section-icon" aria-hidden="true">
              <Sparkles size={19} strokeWidth={1.5} />
            </span>
            <div>
              <h3 id="journal-hidden">Rooftop secrets</h3>
              <p>Small things tucked into the corners of this place.</p>
            </div>
          </div>
          <ul className="collection-grid">
            {HIDDEN_DISCOVERIES.map((item) => {
              const found = state.hidden.includes(item.id);
              return (
                <li key={item.id} className={`collection-card ${found ? 'is-found' : 'is-locked'}`}>
                  <div className="collection-art" aria-hidden="true">
                    <ItemGlyph glyph={item.glyph} size={36} />
                    {!found && (
                      <span className="art-lock">
                        <Lock size={13} />
                      </span>
                    )}
                  </div>
                  <div className="collection-copy">
                    <StatusPill found={found} label={found ? 'Found' : 'Still hidden'} />
                    <h4>{found ? item.name : 'A rooftop secret'}</h4>
                    <p>{found ? item.description : item.hint}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="journal-section" aria-labelledby="journal-islands">
          <div className="section-heading">
            <span className="section-icon" aria-hidden="true">
              <Compass size={19} strokeWidth={1.5} />
            </span>
            <div>
              <h3 id="journal-islands">Worlds beyond the roof</h3>
              <p>Little places found by looking a little farther.</p>
            </div>
          </div>
          <ul className="collection-grid">
            {DREAM_ISLANDS.map((island) => {
              const visited = state.islandsVisited.includes(island.id);
              return (
                <li
                  key={island.id}
                  className={`collection-card ${visited ? 'is-found' : 'is-locked'}`}
                >
                  <div className="collection-art" aria-hidden="true">
                    <ItemGlyph glyph={ISLAND_GLYPHS[island.id]} size={36} />
                    {!visited && (
                      <span className="art-lock">
                        <Lock size={13} />
                      </span>
                    )}
                  </div>
                  <div className="collection-copy">
                    <StatusPill found={visited} label={visited ? 'Visited' : 'Unvisited'} />
                    <h4>{visited ? island.name : 'A distant little world'}</h4>
                    <p>{visited ? island.description : island.hint}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="journal-section" aria-labelledby="journal-moods">
          <div className="section-heading">
            <span className="section-icon" aria-hidden="true">
              <Cat size={19} strokeWidth={1.5} />
            </span>
            <div>
              <h3 id="journal-moods">Whisker&rsquo;s moods</h3>
              <p>Every mood is a small confession. Keep petting.</p>
            </div>
          </div>
          <ul className="collection-grid mood-grid">
            {CAT_REACTIONS.map((item) => {
              const found = state.catReactions.includes(item.id);
              return (
                <li key={item.id} className={`collection-card mood-card ${found ? 'is-found' : 'is-locked'}`}>
                  <div className="collection-art" aria-hidden="true">
                    <ItemGlyph glyph={MOOD_GLYPHS[item.id]} size={34} />
                    {!found && (
                      <span className="art-lock">
                        <Lock size={13} />
                      </span>
                    )}
                  </div>
                  <div className="collection-copy">
                    <StatusPill found={found} label={found ? 'Witnessed' : 'Not yet seen'} />
                    <h4>{found ? item.name : 'A hidden mood'}</h4>
                    <p>{found ? item.description : 'Sit with Whisker a while, and pay attention.'}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <footer className="journal-footer">
          <BookOpen size={15} strokeWidth={1.5} aria-hidden="true" />
          <span>
            {total === TOTAL_DISCOVERIES
              ? 'The rooftop has shown you everything it knows. It is glad you came.'
              : 'There is no hurry. Some things only appear when the lanterns are low.'}
          </span>
        </footer>
      </div>
    </Modal>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
      <path
        d="M12 2.8l2.1 5.8 6.1.2-4.9 3.7 1.7 5.9L12 15l-5 3.4 1.7-5.9-4.9-3.7 6.1-.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M19.4 3v2.4M18.2 4.2h2.4M5.1 18.5v2.2M4 19.6h2.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
