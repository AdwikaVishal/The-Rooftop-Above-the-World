export type GlyphName =
  | 'star'
  | 'moon'
  | 'moonthread'
  | 'comet'
  | 'firefly'
  | 'dust'
  | 'boat'
  | 'key'
  | 'feather'
  | 'jam'
  | 'chalk'
  | 'flower'
  | 'lantern'
  | 'quilt'
  | 'orrery'
  | 'purr'
  | 'blink'
  | 'stretch'
  | 'yawn'
  | 'tail'
  | 'cat'
  | 'fern'
  | 'lavender'
  | 'teacup'
  | 'woven';

interface ItemGlyphProps {
  glyph: GlyphName;
  size?: number;
  className?: string;
}

export function ItemGlyph({ glyph, size = 34, className }: ItemGlyphProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {renderGlyph(glyph)}
    </svg>
  );
}

function renderGlyph(glyph: GlyphName) {
  switch (glyph) {
    case 'star':
      return (
        <>
          <path
            d="M16 2.8l2.7 7.3 7.8.3-6.2 4.7 2.1 7.5L16 18l-6.4 4.6 2.1-7.5-6.2-4.7 7.8-.3z"
            fill="#f2c879"
            stroke="#f5ebdd"
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="15" r="1.6" fill="#fff8e8" />
          <path d="M25.8 4.3v3.4M24.1 6h3.4M5.6 22.6v2.6M4.3 23.9h2.6" stroke="#f5ebdd" strokeWidth="1" strokeLinecap="round" opacity=".8" />
        </>
      );
    case 'moon':
      return (
        <>
          <circle cx="16" cy="16" r="12" fill="#9ebae0" opacity=".13" />
          <path
            d="M21.8 5.2a10.7 10.7 0 1 0 5 17.7 8.6 8.6 0 1 1-5-17.7z"
            fill="#c3b9e8"
            stroke="#f5ebdd"
            strokeWidth=".8"
          />
          <path d="M8 23.5l4-3.2 3.1 1.1 4.1-4.2" fill="none" stroke="#9ebae0" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="10" cy="8" r=".8" fill="#f2c879" />
        </>
      );
    case 'moonthread':
      return (
        <>
          <path
            d="M21.7 4.8a10.2 10.2 0 1 0 5.6 17.4 8.3 8.3 0 1 1-5.6-17.4z"
            fill="#f5ebdd"
            stroke="#d8d0e7"
            strokeWidth=".8"
          />
          <path
            d="M11 23.4c2.8-1.5 2.9-4.3 5.4-5.6 1.9-1 3.2.2 2.6 1.7-.7 1.7-3.8 2.1-5.9 1.4"
            fill="none"
            stroke="#c3b9e8"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="9.5" cy="8.4" r=".9" fill="#f2c879" />
        </>
      );
    case 'comet':
      return (
        <>
          <path d="M9 11.2L25.7 5l-6.9 15.8-4.8-4.2z" fill="#d9a4b3" opacity=".55" />
          <circle cx="20.3" cy="14.3" r="5.1" fill="#f2c879" />
          <circle cx="18.9" cy="13" r="1.6" fill="#fff5dc" />
          <path d="M9.4 11.8l5.4 5.1M6.4 9.2l5 4.4M13.2 9.4l3.1 6.2" stroke="#f5ebdd" strokeWidth="1" strokeLinecap="round" opacity=".65" />
          <path d="M25.6 7.2v2.2M24.5 8.3h2.2" stroke="#f5ebdd" strokeWidth=".9" strokeLinecap="round" />
        </>
      );
    case 'firefly':
      return (
        <>
          <circle cx="16" cy="16.8" r="8.6" fill="#f2c879" opacity=".15" />
          <circle cx="16" cy="16.8" r="5.2" fill="#f2c879" opacity=".28" />
          <ellipse cx="12.8" cy="12.3" rx="3.2" ry="4.8" transform="rotate(-30 12.8 12.3)" fill="#f5ebdd" opacity=".62" />
          <ellipse cx="19.2" cy="12.3" rx="3.2" ry="4.8" transform="rotate(30 19.2 12.3)" fill="#f5ebdd" opacity=".48" />
          <ellipse cx="16" cy="17" rx="2.4" ry="3.8" fill="#fff6d9" />
          <circle cx="16" cy="16.2" r="1.5" fill="#f2c879" />
          <path d="M13.8 20.8l-1.2 1.7M18.2 20.8l1.2 1.7" stroke="#9caf98" strokeWidth=".8" strokeLinecap="round" />
        </>
      );
    case 'dust':
      return (
        <>
          <path d="M10.2 7.4l1.1 3 3 1.1-3 1.1-1.1 3-1.1-3-3-1.1 3-1.1z" fill="#f5ebdd" />
          <path d="M21.6 4.4l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" fill="#f2c879" />
          <path d="M22.7 18.1l1 2.7 2.7 1-2.7 1-1 2.7-1-2.7-2.7-1 2.7-1z" fill="#c3b9e8" />
          <circle cx="10.4" cy="21.6" r="1.1" fill="#9caf98" />
          <circle cx="15.7" cy="14.8" r=".7" fill="#f5ebdd" opacity=".8" />
          <circle cx="7.4" cy="14.9" r=".6" fill="#d9a4b3" />
        </>
      );
    case 'boat':
      return (
        <>
          <path d="M4.8 17.2h22.4L16 25.3z" fill="#f5ebdd" stroke="#cdc4b8" strokeWidth=".8" strokeLinejoin="round" />
          <path d="M16 5.2l8.2 11.1H16z" fill="#ece0ce" />
          <path d="M16 6.1L8.7 16.3H16z" fill="#f7f0e4" />
          <path d="M16 5.2v12.1M4.8 17.2h22.4" stroke="#b9b0a8" strokeWidth=".8" strokeLinecap="round" />
          <path d="M9 28.3c1.4-1 2.8-.3 4.2-.3s2.8-1.2 4.2-.3 2.8.7 5.6.2" fill="none" stroke="#9c91c8" strokeWidth="1" strokeLinecap="round" opacity=".7" />
        </>
      );
    case 'key':
      return (
        <>
          <circle cx="10.4" cy="11.1" r="5.1" fill="none" stroke="#d8b26f" strokeWidth="2.4" />
          <circle cx="10.4" cy="11.1" r="1.8" fill="#0f1426" opacity=".25" />
          <path d="M14.8 14.7l11 11.7M22.6 22.5l2.7-2.3M19.8 19.5l2-1.8" fill="none" stroke="#d8b26f" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M10 6.8c.6-.9 1.5-1.6 2.4-2" fill="none" stroke="#f5ebdd" strokeWidth=".8" strokeLinecap="round" opacity=".7" />
        </>
      );
    case 'feather':
      return (
        <>
          <path d="M7.2 24.9c1.5-8.9 5.2-15.7 16-18.2 1.6 8.4-3.4 16-12.9 18.9z" fill="#f5ebdd" stroke="#d8d0e7" strokeWidth=".8" />
          <path d="M7.2 24.9L22.5 6.6" stroke="#c3b9e8" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M11.8 18.3l4.6 1.2M14.6 14.3l4.3 1.3M17.6 10.5l3.4 1.2" stroke="#c3b9e8" strokeWidth=".8" strokeLinecap="round" opacity=".8" />
        </>
      );
    case 'jam':
      return (
        <>
          <rect x="8.2" y="10.6" width="15.6" height="16.2" rx="3.2" fill="#6b3d5d" stroke="#4b2b42" strokeWidth=".8" />
          <rect x="7.2" y="6" width="17.6" height="5.6" rx="1.8" fill="#d9a4b3" />
          <rect x="9.3" y="7.3" width="5.2" height="2" rx="1" fill="#f5ebdd" opacity=".35" />
          <path d="M11.3 15.2c1.2-1.2 2.7-1.9 4.4-1.9 1.4 0 2.6.5 3.5 1.2" fill="none" stroke="#f5ebdd" strokeWidth=".9" strokeLinecap="round" opacity=".55" />
          <circle cx="13.6" cy="20.5" r="1.5" fill="#3c2140" />
          <circle cx="19.4" cy="21.6" r="1.2" fill="#3c2140" />
          <path d="M15.9 6v5.6" stroke="#f5ebdd" strokeWidth=".7" opacity=".25" />
        </>
      );
    case 'chalk':
      return (
        <>
          <path
            d="M16 4.5l3.2 8 8.5.6-6.6 5.4 2.1 8.2L16 21.9l-7.2 4.8 2.1-8.2-6.6-5.4 8.5-.6z"
            fill="none"
            stroke="#f5ebdd"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeDasharray="3.4 2.2"
            opacity=".72"
          />
          <circle cx="9" cy="8.6" r=".8" fill="#f5ebdd" opacity=".45" />
          <circle cx="24.1" cy="23.1" r="1.1" fill="#f5ebdd" opacity=".3" />
          <path d="M25.3 6.4l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8z" fill="#f5ebdd" opacity=".5" />
        </>
      );
    case 'flower':
      return (
        <>
          <path d="M16 16.3c0-4.9-6.2-6.4-7.5-2.4-1.6 4.8 4.2 7 7.5 2.4zM16 16.3c0-4.9 6.2-6.4 7.5-2.4 1.6 4.8-4.2 7-7.5 2.4zM16 16.3c-4.2-2.5-8.4 2.7-4.7 5.9 3.2 2.7 6.6-1.2 4.7-5.9zM16 16.3c4.2-2.5 8.4 2.7 4.7 5.9-3.2 2.7-6.6-1.2-4.7-5.9z" fill="#f5ebdd" opacity=".9" />
          <circle cx="16" cy="16.2" r="2.7" fill="#f2c879" />
          <path d="M16 19v8M16 24c-2.2-.8-3.4-2-4-3.8M16 26c2-.6 3.2-1.7 4-3.2" fill="none" stroke="#9caf98" strokeWidth="1.4" strokeLinecap="round" />
        </>
      );
    case 'lantern':
      return (
        <>
          <circle cx="16" cy="14.4" r="9" fill="#f2c879" opacity=".16" />
          <path d="M16 3.6v2.7M12.6 8.1h6.8l2.2 3.3v9.8l-2.2 3.2h-6.8l-2.2-3.2V11.4z" fill="#242a42" stroke="#9c91c8" strokeWidth="1.1" />
          <path d="M12.4 11.7h7.2v9.4h-7.2z" fill="#f2c879" opacity=".87" />
          <path d="M10.4 8.1h11.2M11.9 24.4h8.2M13.9 27h4.2" stroke="#9c91c8" strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="16" cy="16.4" r="2.1" fill="#fff5d9" />
        </>
      );
    case 'quilt':
      return (
        <>
          <path d="M6.2 7.1h19.6v17.8H6.2z" fill="#4a5578" stroke="#f5ebdd" strokeWidth=".8" opacity=".9" />
          <path d="M6.2 16h19.6M16 7.1v17.8" stroke="#f5ebdd" strokeWidth=".8" opacity=".45" />
          <path d="M11.1 13.1l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z" fill="#f2c879" />
          <path d="M21.4 9.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" fill="#f5ebdd" />
          <path d="M22.3 18.3l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6z" fill="#d9a4b3" />
          <circle cx="11.3" cy="21.8" r="1.4" fill="#9caf98" />
          <path d="M4.7 25.7h22.6" stroke="#f5ebdd" strokeWidth=".8" strokeDasharray="1.8 1.8" opacity=".5" />
        </>
      );
    case 'orrery':
      return (
        <>
          <ellipse cx="16" cy="16" rx="11.8" ry="6.7" fill="none" stroke="#d8b26f" strokeWidth="1.1" transform="rotate(-17 16 16)" />
          <ellipse cx="16" cy="16" rx="7.1" ry="11.2" fill="none" stroke="#d8b26f" strokeWidth=".9" transform="rotate(-12 16 16)" />
          <circle cx="16" cy="16" r="3" fill="#f2c879" />
          <circle cx="25.7" cy="12.4" r="1.8" fill="#c3b9e8" />
          <circle cx="10.4" cy="23.2" r="1.4" fill="#d9a4b3" />
          <path d="M16 20.2v7.1M12.6 27.3h6.8" stroke="#d8b26f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      );
    case 'purr':
      return (
        <>
          <path d="M5 10.6l3.1 2.2 2.6-2.8 2.5 2.8 2.9-2.2M5 16.6l3.1 2.2 2.6-2.8 2.5 2.8 2.9-2.2M5 22.6l3.1 2.2 2.6-2.8 2.5 2.8 2.9-2.2" fill="none" stroke="#f2c879" strokeWidth="1.4" strokeLinecap="round" opacity=".85" />
          <path d="M18.5 8.5c3.4-2.1 7.4-1.6 9.3.7 1.8 2.2 1.1 5.3-1.3 7.2-2 1.6-5 2.2-7.6 1.6l-3.2 1.9.3-3.7c-1.5-2.5-1.2-5.5 2.5-7.7z" fill="#f5ebdd" opacity=".85" />
          <path d="M21 13.5c1.7-.3 3.2.3 4.2 1.3" fill="none" stroke="#9c91c8" strokeWidth="1" strokeLinecap="round" />
        </>
      );
    case 'blink':
      return (
        <>
          <path d="M4.2 16c3.6-5.2 8-7.8 11.8-7.8S24.2 10.8 27.8 16c-3.6 5.2-8 7.8-11.8 7.8S7.8 21.2 4.2 16z" fill="none" stroke="#f5ebdd" strokeWidth="1.3" />
          <circle cx="16" cy="16" r="4.1" fill="#9c91c8" opacity=".55" />
          <circle cx="16" cy="16" r="1.9" fill="#f5ebdd" />
          <path d="M8.8 8.2l-1.7-2M16 5.5V3M23.2 8.2l1.7-2" stroke="#f2c879" strokeWidth="1" strokeLinecap="round" />
        </>
      );
    case 'stretch':
      return (
        <>
          <path d="M5.6 20.2c2.4-2.6 4.2-3.9 7.3-3.9 2.7 0 4.1.9 5.5 2.4 1.3 1.4 2.8 2.4 5 2.8l3.8.6" fill="none" stroke="#f5ebdd" strokeWidth="3" strokeLinecap="round" />
          <path d="M23.4 15.5c2.2-.9 4.3-.2 5.2 1.3 1 1.6-.1 3.6-2.2 4.4" fill="none" stroke="#f5ebdd" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M5.6 20.2l-1 4.1M8.3 19.4l-.4 4.4M27.2 21.2l.8 3.7" stroke="#f2c879" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M10.1 16.5c.1-2 1.6-3.5 3.6-3.5 1.9 0 3.4 1.4 3.6 3.2" fill="none" stroke="#9c91c8" strokeWidth="1" strokeLinecap="round" opacity=".65" />
        </>
      );
    case 'yawn':
      return (
        <>
          <path d="M8.8 9.1c1.7-2.5 4.4-4 7.2-4s5.5 1.5 7.2 4" fill="none" stroke="#f5ebdd" strokeWidth="1.2" strokeLinecap="round" opacity=".6" />
          <ellipse cx="16" cy="18.4" rx="6.6" ry="7.4" fill="#4a2f36" />
          <ellipse cx="16" cy="21" rx="3.6" ry="2.3" fill="#d9a4b3" />
          <path d="M10.3 6.6l-1.6-2M21.7 6.6l1.6-2" stroke="#f2c879" strokeWidth="1" strokeLinecap="round" />
        </>
      );
    case 'tail':
      return (
        <>
          <path d="M10.4 27.7c-1.6-5.1-.2-8.6 4.1-10.5 4.2-1.9 7.7-.9 8.5 2.4.8 3.1-1.6 5.4-4.2 5-2.1-.4-2.8-2.4-1.8-3.9" fill="none" stroke="#f5ebdd" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M14.7 9.6c.4-.2.9-.3 1.4-.1 1.7.6 2.7 2.3 2.3 4" fill="none" stroke="#f2c879" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="13.1" cy="6.7" r="1.1" fill="#d9a4b3" />
        </>
      );
    case 'fern':
      return (
        <>
          <path d="M16 28c-.4-6.1-1.9-11.7-5-16.8M16 28c.2-7.2 1.4-13.5 4.7-19.2M16 27c-4.6-2.7-8.2-6.6-10.5-11.5M16 26c4.8-2.4 8.7-6.2 11.2-11.1" fill="none" stroke="#9caf98" strokeWidth="1.5" strokeLinecap="round" />
          {[6, 8.6, 11.2, 13.8, 16.4].map((y, index) => (
            <g key={y}>
              <ellipse cx={10.5 + index * 0.7} cy={y} rx="3.2" ry="1.2" fill="#9caf98" transform={`rotate(${-28 + index * 4} ${10.5 + index * 0.7} ${y})`} opacity=".85" />
              <ellipse cx={21.3 - index * 0.7} cy={y + 0.6} rx="3.1" ry="1.15" fill="#6f8a76" transform={`rotate(${28 - index * 4} ${21.3 - index * 0.7} ${y + 0.6})`} opacity=".9" />
            </g>
          ))}
        </>
      );
    case 'lavender':
      return (
        <>
          <path d="M11 28c.4-6.7 1.7-13.2 3.9-19.5M16 28c-.3-7.5-.2-14.4.2-21M21 28c-.3-6.5-1.7-12.5-4-18" fill="none" stroke="#9caf98" strokeWidth="1.4" strokeLinecap="round" />
          {[
            [14.3, 7.1],
            [15.2, 5.8],
            [16.1, 6.9],
            [17.1, 5.3],
            [18, 6.7],
            [10.8, 9.1],
            [12.1, 8.4],
            [8.9, 10.3],
            [21.1, 9.4],
            [19.8, 10.5],
            [22.1, 8.5],
          ].map(([x, y], index) => (
            <circle key={index} cx={x} cy={y} r={index % 2 === 0 ? 1.7 : 1.2} fill={index % 3 === 0 ? '#c3b9e8' : '#9c91c8'} />
          ))}
          <path d="M9.5 22.3c2.1-1.4 4-2.1 6.3-2.5M22 20.5c-2-1.1-3.8-1.6-5.7-1.8" stroke="#9caf98" strokeWidth="1" strokeLinecap="round" opacity=".8" />
        </>
      );
    case 'teacup':
      return (
        <>
          <ellipse cx="16" cy="25.3" rx="10.2" ry="2.7" fill="#d8c9b6" opacity=".55" />
          <path d="M8.3 15.3h13.4v4.8c0 3.1-2.6 5.6-5.8 5.6h-1.8c-3.2 0-5.8-2.5-5.8-5.6z" fill="#f5ebdd" stroke="#cbbda9" strokeWidth=".8" />
          <path d="M21.7 16.4h1.7c2.2 0 3.4 1.7 2.8 3.5-.5 1.5-2 2.4-3.6 2.2" fill="none" stroke="#cbbda9" strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx="15" cy="15.2" rx="6.7" ry="1.7" fill="#7a5340" />
          <path d="M13.2 11.2c-2-1.7 1.1-2.7-.2-4.6M18 11c-1.7-1.4 1-2.4.1-4" fill="none" stroke="#f5ebdd" strokeWidth="1" strokeLinecap="round" opacity=".55" />
          <path d="M10.8 19.1c1.8.9 3.5 1.3 5.3 1.2" stroke="#e6dccd" strokeWidth=".8" strokeLinecap="round" opacity=".7" />
        </>
      );
    case 'woven':
      return (
        <>
          <ellipse cx="16" cy="16.4" rx="12.5" ry="8.1" fill="#343a5b" stroke="#9c91c8" strokeWidth=".9" />
          <ellipse cx="16" cy="16.4" rx="9.8" ry="6.1" fill="none" stroke="#f5ebdd" strokeWidth=".7" opacity=".3" />
          <path d="M4.8 14.8c3.4-1.7 7.2-2.5 11.2-2.5s7.8.8 11.2 2.5M4.8 18c3.4 1.7 7.2 2.5 11.2 2.5S23.8 19.7 27.2 18" fill="none" stroke="#d9a4b3" strokeWidth="1" opacity=".65" />
          <path d="M8.7 10.4l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6z" fill="#f2c879" opacity=".8" />
          <path d="M24.2 20.5l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z" fill="#c3b9e8" opacity=".8" />
        </>
      );
    case 'cat':
      return (
        <>
          <path d="M8.3 12l-1.2-6.2 5.2 3.1c2.2-.8 4.6-.8 6.8 0l5.2-3.1L23.1 12c1.4 1.6 2.2 3.6 2.2 5.7 0 5.2-4.2 8.6-9.3 8.6s-9.3-3.4-9.3-8.6c0-2.1.8-4.1 2.2-5.7z" fill="#d6ae86" stroke="#f5ebdd" strokeWidth=".8" />
          <path d="M11.4 15.5c.4.5.9.5 1.3 0M19.2 15.5c.4.5.9.5 1.3 0" stroke="#3d2f2a" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M15 19.1l1 .8 1-.8M16 19.9v1.2" fill="none" stroke="#3d2f2a" strokeWidth=".8" strokeLinecap="round" />
          <path d="M9.8 18.1l-3 .8M10 20l-3 1.3M22.2 18.1l3 .8M22 20l3 1.3" stroke="#f5ebdd" strokeWidth=".6" strokeLinecap="round" opacity=".8" />
        </>
      );
  }
}
