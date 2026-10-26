import type { DecorationId } from '../types/world';
import { ItemGlyph, type GlyphName } from './ItemGlyph';

const GLYPHS: Record<DecorationId, GlyphName> = {
  fern: 'fern',
  lavender: 'lavender',
  'night-bloom': 'flower',
  'amber-glow': 'lantern',
  moonlit: 'lantern',
  'woven-rug': 'woven',
  'star-quilt': 'quilt',
  teacup: 'teacup',
  orrery: 'orrery',
};

interface DecorationPreviewProps {
  id: DecorationId;
  size?: number;
}

export function DecorationPreview({ id, size = 48 }: DecorationPreviewProps) {
  return (
    <div className={`decoration-preview preview-${id}`} aria-hidden="true">
      <span className="preview-glow" />
      <ItemGlyph glyph={GLYPHS[id]} size={size} />
    </div>
  );
}
