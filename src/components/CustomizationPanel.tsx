import { Check, Coffee, Flower2, Grid2X2, Lamp, Lock, Sparkles } from 'lucide-react';
import {
  DECORATION_CATEGORIES,
  DECORATIONS,
  isDecorationUnlocked,
} from '../data/decorations';
import type {
  DecorationCategory,
  DecorationId,
  Selections,
  WorldState,
} from '../types/world';
import { DecorationPreview } from './DecorationPreview';
import { Modal, PanelHeader } from './Modal';

interface CustomizationPanelProps {
  state: WorldState;
  selections: Selections;
  onSelect: (category: DecorationCategory, id: DecorationId) => void;
  onClose: () => void;
}

const CATEGORY_ICONS = {
  planter: Flower2,
  lantern: Lamp,
  rug: Grid2X2,
  trinket: Coffee,
} satisfies Record<DecorationCategory, typeof Flower2>;

export function CustomizationPanel({
  state,
  selections,
  onSelect,
  onClose,
}: CustomizationPanelProps) {
  return (
    <Modal labelledBy="customize-title" onClose={onClose} className="customize-panel">
      <PanelHeader
        eyebrow="Make it yours"
        title="A Few Small Things"
        titleId="customize-title"
        onClose={onClose}
        closeLabel="Close customization"
      >
        <p className="panel-intro">
          The rooftop remembers these choices. A few things only appear after you&rsquo;ve found
          a little more of the night.
        </p>
      </PanelHeader>

      <div
        className="customize-scroll"
        role="region"
        aria-label="Rooftop decoration choices"
        tabIndex={0}
      >
        {DECORATION_CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category.id];
          const options = DECORATIONS.filter((option) => option.category === category.id);
          return (
            <section className="customize-section" key={category.id}>
              <div className="customize-section-heading">
                <span className="section-icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={1.5} />
                </span>
                <div>
                  <h3 id={`category-${category.id}`}>{category.label}</h3>
                  <p>{category.blurb}</p>
                </div>
              </div>
              <div
                className="decoration-options"
                role="radiogroup"
                aria-labelledby={`category-${category.id}`}
              >
                {options.map((option) => {
                  const unlocked = isDecorationUnlocked(option.id, state);
                  const selected = selections[category.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={`decoration-option ${selected ? 'is-selected' : ''} ${unlocked ? '' : 'is-locked'}`}
                      disabled={!unlocked}
                      onClick={() => onSelect(category.id, option.id)}
                    >
                      <DecorationPreview id={option.id} />
                      <span className="decoration-copy">
                        <span className="decoration-name">
                          {option.name}
                          {selected && <Check size={14} strokeWidth={2} aria-hidden="true" />}
                          {!unlocked && <Lock size={13} strokeWidth={1.8} aria-hidden="true" />}
                        </span>
                        <span className="decoration-description">
                          {unlocked
                            ? option.description
                            : 'A small thing still waiting to be found.'}
                        </span>
                        {!unlocked && (
                          <span className="decoration-requirement">
                            <Sparkles size={11} aria-hidden="true" />
                            {option.requirement}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        <footer className="customize-footer">
          <Sparkles size={14} strokeWidth={1.5} aria-hidden="true" />
          <span>Every change is saved on this device, exactly as you leave it.</span>
        </footer>
      </div>
    </Modal>
  );
}
