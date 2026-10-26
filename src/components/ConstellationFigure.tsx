import { useId } from 'react';
import type { Constellation } from '../data/constellations';

interface ConstellationFigureProps {
  constellation: Constellation;
  discovered: boolean;
  className?: string;
  decorative?: boolean;
}

export function ConstellationFigure({
  constellation,
  discovered,
  className,
  decorative = false,
}: ConstellationFigureProps) {
  const filterId = useId().replace(/:/g, '');
  const accent = constellation.accent;

  return (
    <svg
      viewBox="-4 -4 108 108"
      className={className}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : discovered ? constellation.name : 'An unnamed constellation'}
    >
      <defs>
        <filter id={`glow-${filterId}`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={`wash-${filterId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity={discovered ? '0.12' : '0.03'} />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="50" cy="50" rx="58" ry="54" fill={`url(#wash-${filterId})`} />

      {discovered && (
        <g
          stroke={accent}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.72"
        >
          {constellation.lines.map(([startIndex, endIndex], index) => {
            const start = constellation.points[startIndex];
            const end = constellation.points[endIndex];
            if (!start || !end) return null;
            return <line key={index} x1={start.x} y1={start.y} x2={end.x} y2={end.y} />;
          })}
        </g>
      )}

      <g filter={discovered ? `url(#glow-${filterId})` : undefined}>
        {constellation.points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r={(point.size ?? 2) * (discovered ? 1.9 : 1.3)}
              fill={accent}
              opacity={discovered ? 0.16 : 0.07}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={(point.size ?? 2) * (discovered ? 0.9 : 0.65)}
              fill={discovered ? '#fff6e6' : accent}
              opacity={discovered ? 1 : 0.38}
              className={discovered ? 'constellation-star' : undefined}
              style={{ animationDelay: `${index * 0.4}s` }}
            />
          </g>
        ))}
      </g>

      {discovered && (
        <g opacity="0.55">
          <circle cx="92" cy="12" r="1.1" fill="#f5ebdd" />
          <circle cx="7" cy="86" r="0.8" fill="#f5ebdd" />
          <circle cx="84" cy="92" r="0.7" fill={accent} />
        </g>
      )}
    </svg>
  );
}
