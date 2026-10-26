import {
  BookOpen,
  CircleHelp,
  CloudMoon,
  Compass,
  Flower2,
  Heart,
  Lamp,
  Library,
  MoonStar,
  Palette,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { TOTAL_DISCOVERIES } from '../game/systems/DiscoverySystem';

interface HUDProps {
  total: number;
  lightsOn: boolean;
  soundOn: boolean;
  onOpenJournal: () => void;
  onOpenGarden: () => void;
  onOpenCustomize: () => void;
  onOpenGuide: () => void;
  onToggleLights: () => void;
  onToggleSound: () => void;
  onExploreSky: () => void;
  dreamscapeActive: boolean;
  onOpenSanctuary: () => void;
  onOpenEscape: () => void;
  onOpenStories: () => void;
  onOpenTogether: () => void;
  quietMode: boolean;
  onLeaveQuietMode: () => void;
}

export function HUD({
  total,
  lightsOn,
  soundOn,
  onOpenJournal,
  onOpenGarden,
  onOpenCustomize,
  onOpenGuide,
  onToggleLights,
  onToggleSound,
  onExploreSky,
  dreamscapeActive,
  onOpenSanctuary,
  onOpenEscape,
  onOpenStories,
  onOpenTogether,
  quietMode,
  onLeaveQuietMode,
}: HUDProps) {
  return (
    <>
      <header className="hud-top">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <MoonStar size={22} strokeWidth={1.4} />
          </div>
          <div className="brand-text">
            <h1>
              The Rooftop <span>Above the World</span>
            </h1>
            <p>a small night garden</p>
          </div>
        </div>

        <nav className={`hud-actions${quietMode ? ' is-quiet' : ''}`} aria-label="Rooftop controls">
          {quietMode ? (
            <button
              type="button"
              className="hud-button"
              onClick={onLeaveQuietMode}
              aria-label="Leave quiet mode"
            >
              <MoonStar size={18} strokeWidth={1.6} aria-hidden="true" />
              <span className="hud-button-label">Leave quiet mode</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="hud-button"
                onClick={onOpenEscape}
                aria-label="Open 5-minute escape"
              >
                <CloudMoon size={18} strokeWidth={1.6} aria-hidden="true" />
                <span className="hud-button-label">Escape</span>
              </button>
              <button
                type="button"
                className="hud-button"
                onClick={onExploreSky}
                aria-label={dreamscapeActive ? 'Return to the original rooftop' : 'Explore the 3D sky'}
              >
                {dreamscapeActive ? <MoonStar size={18} strokeWidth={1.6} aria-hidden="true" /> : <Compass size={18} strokeWidth={1.6} aria-hidden="true" />}
                <span className="hud-button-label">{dreamscapeActive ? 'Return to the roof' : 'Explore the sky'}</span>
              </button>
              <button
                type="button"
                className="hud-button"
                onClick={onOpenJournal}
                aria-label={`Open journal, ${total} of ${TOTAL_DISCOVERIES} discoveries`}
              >
                <BookOpen size={18} strokeWidth={1.6} aria-hidden="true" />
                <span className="hud-button-label">Journal</span>
                <span className="hud-count" aria-hidden="true">{total}</span>
              </button>
              <button
                type="button"
                className="hud-button"
                onClick={onOpenGarden}
                aria-label="Open the rooftop garden"
              >
                <Flower2 size={18} strokeWidth={1.6} aria-hidden="true" />
                <span className="hud-button-label">Garden</span>
              </button>
              <button
                type="button"
                className="hud-button"
                onClick={onOpenTogether}
                aria-label="Open rooftops together"
              >
                <Users size={18} strokeWidth={1.6} aria-hidden="true" />
                <span className="hud-button-label">Together</span>
              </button>
              <button
                type="button"
                className="hud-button"
                onClick={onOpenStories}
                aria-label="Open words from others"
              >
                <Library size={18} strokeWidth={1.6} aria-hidden="true" />
                <span className="hud-button-label">Stories</span>
              </button>
              <button
                type="button"
                className="hud-button"
                onClick={onOpenSanctuary}
                aria-label="Open You Can Stay quiet corner"
              >
                <Heart size={18} strokeWidth={1.6} aria-hidden="true" />
                <span className="hud-button-label">You can stay</span>
              </button>
              <button
                type="button"
                className="hud-button"
                onClick={onOpenCustomize}
                aria-label="Customize the rooftop"
              >
                <Palette size={18} strokeWidth={1.6} aria-hidden="true" />
                <span className="hud-button-label">Make it yours</span>
              </button>
              <button
                type="button"
                className="hud-button hud-button-icon"
                onClick={onToggleSound}
                aria-pressed={soundOn}
                aria-label={soundOn ? 'Mute rooftop sound' : 'Enable rooftop sound'}
              >
                {soundOn ? <Volume2 size={18} strokeWidth={1.6} aria-hidden="true" /> : <VolumeX size={18} strokeWidth={1.6} aria-hidden="true" />}
              </button>
              <button
                type="button"
                className="hud-button hud-button-icon"
                onClick={onOpenGuide}
                aria-label="Open guide and settings"
              >
                <CircleHelp size={18} strokeWidth={1.6} aria-hidden="true" />
              </button>
            </>
          )}
          {quietMode ? (
            <button
              type="button"
              className="hud-button hud-button-icon"
              onClick={onToggleSound}
              aria-pressed={soundOn}
              aria-label={soundOn ? 'Mute rooftop sound' : 'Enable rooftop sound'}
            >
              {soundOn ? <Volume2 size={18} strokeWidth={1.6} aria-hidden="true" /> : <VolumeX size={18} strokeWidth={1.6} aria-hidden="true" />}
            </button>
          ) : null}
        </nav>
      </header>

      {!quietMode && (
        <div className="hud-bottom">
          <button
            type="button"
            className={`lights-chip ${lightsOn ? 'is-on' : 'is-off'}`}
            onClick={onToggleLights}
            aria-pressed={lightsOn}
            aria-label={lightsOn ? 'Turn the lanterns off' : 'Turn the lanterns on'}
          >
            <Lamp size={16} strokeWidth={1.6} aria-hidden="true" />
            <span>{lightsOn ? 'Lanterns on' : 'Lanterns off'}</span>
          </button>
          <p className="hud-hint" aria-hidden="true">
            <Sparkles size={13} strokeWidth={1.5} />
            Wander. Touch what glows.
          </p>
        </div>
      )}
    </>
  );
}
