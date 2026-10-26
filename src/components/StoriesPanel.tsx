import { useMemo, useState } from 'react';
import { BookOpen, HeartHandshake, Library, Quote, Sparkles } from 'lucide-react';
import { STORIES, STORY_THEMES, type StoryTheme } from '../data/stories';
import { Modal, PanelHeader } from './Modal';

interface StoriesPanelProps {
  onClose: () => void;
}

export function StoriesPanel({ onClose }: StoriesPanelProps) {
  const [theme, setTheme] = useState<StoryTheme | 'all'>('all');
  const stories = useMemo(() => {
    if (theme === 'all') return STORIES;
    return STORIES.filter((story) => story.theme === theme);
  }, [theme]);

  return (
    <Modal labelledBy="stories-title" onClose={onClose} className="stories-panel">
      <PanelHeader
        eyebrow="Somewhere, someone understands"
        title="Words from others"
        titleId="stories-title"
        onClose={onClose}
        closeLabel="Close stories"
      >
        <p className="panel-intro">
          Short, gentle stories about loneliness, friendship, change, and hard days. Not advice. Just company.
        </p>
      </PanelHeader>

      <div className="stories-toolbar">
        <div className="stories-theme-row">
          <button
            type="button"
            className={`stories-theme-pill ${theme === 'all' ? 'is-selected' : ''}`}
            onClick={() => setTheme('all')}
            aria-pressed={theme === 'all'}
          >
            <Library size={14} /> All
          </button>
          {STORY_THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`stories-theme-pill ${theme === item.id ? 'is-selected' : ''}`}
              onClick={() => setTheme(item.id)}
              aria-pressed={theme === item.id}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="stories-note">
          <HeartHandshake size={14} /> Original in-app writing. No visitor submissions yet.
        </div>
      </div>

      <div className="stories-scroll">
        <div className="stories-grid">
          {stories.map((story) => (
            <article key={story.id} className="story-card">
              <div className="story-card-header">
                <Quote size={18} aria-hidden="true" />
                <div>
                  <p className="story-theme">{STORY_THEMES.find((item) => item.id === story.theme)?.label}</p>
                  <h3>{story.title}</h3>
                </div>
              </div>
              <p className="story-body">{story.body}</p>
            </article>
          ))}
        </div>
        <footer className="stories-footer">
          <BookOpen size={15} />
          <span>You do not owe anyone a reply. It is enough to read.</span>
          <Sparkles size={15} />
        </footer>
      </div>
    </Modal>
  );
}
