/**
 * The brand arch mark, rendered as inline SVG.
 *
 * The mark is geometric (arch + horizon + sun + diamond ornament);
 * the wordmark is set in Cormorant SC via real type so we don't
 * carry font path data inside the SVG.
 *
 * One color: `--color-accent` (champagne). Never doubled.
 * On a dark surface the mark stays champagne; on bone, switch by
 * setting `style={{ color: 'var(--color-text-inverse)' }}` on the
 * wrapper.
 */
export function ArchLogo({ size = 'md', showWordmark = true, className }) {
  const heights = { sm: 32, md: 48, lg: 64 };
  const h = heights[size] || heights.md;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        color: 'var(--color-accent)',
        lineHeight: 1,
      }}
    >
      <svg
        viewBox="0 0 320 320"
        role="img"
        aria-label="Granderson Destinations"
        height={h}
        width={h}
        style={{ display: 'block' }}
      >
        <defs>
          <clipPath id="arch-clip">
            <path d="M 80 245 L 80 155 A 80 80 0 0 1 240 155 L 240 245 Z" />
          </clipPath>
        </defs>

        {/* Horizon brackets */}
        <line x1="20" y1="245" x2="80" y2="245" stroke="currentColor" strokeWidth="0.8" />
        <line x1="240" y1="245" x2="300" y2="245" stroke="currentColor" strokeWidth="0.8" />

        {/* Arch outline */}
        <path
          d="M 80 245 L 80 155 A 80 80 0 0 1 240 155 L 240 245"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
        />

        {/* Interior horizon + sun + ground lines, clipped by the arch */}
        <g clipPath="url(#arch-clip)">
          <line x1="76" y1="170" x2="244" y2="170" stroke="currentColor" strokeWidth="0.9" />
          <path d="M 132 170 A 28 28 0 0 1 188 170 Z" fill="currentColor" />
          <line x1="96" y1="192" x2="224" y2="192" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
          <line x1="104" y1="212" x2="216" y2="212" stroke="currentColor" strokeWidth="0.6" opacity="0.42" />
          <line x1="116" y1="230" x2="204" y2="230" stroke="currentColor" strokeWidth="0.6" opacity="0.28" />
        </g>

        {/* Diamond ornament above */}
        <polygon points="160,90 163,93.5 160,97 157,93.5" fill="currentColor" />
      </svg>

      {showWordmark && (
        <span
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            gap: '2px',
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-caps)',
            fontWeight: 'var(--weight-regular)',
            letterSpacing: 'var(--tracking-caps)',
            textIndent: 'var(--tracking-caps)',
            textTransform: 'uppercase',
            lineHeight: 1.1,
          }}
        >
          <span style={{ fontSize: '14px' }}>Granderson</span>
          <span style={{ fontSize: '10px', color: 'var(--color-text-quiet)' }}>Destinations</span>
        </span>
      )}
    </span>
  );
}
