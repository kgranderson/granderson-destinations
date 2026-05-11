/**
 * The brand arch mark, rendered as inline SVG.
 *
 * The mark is geometric (arch + horizon + sun + diamond ornament);
 * the wordmark is set in Cormorant SC via real type so we don't
 * carry font path data inside the SVG.
 *
 * One color: `--color-accent` (champagne). Never doubled.
 * On a dark surface the mark stays champagne; on bone, the surface
 * scope re-tones --color-accent so the mark stays legible.
 *
 * Sizes are intentionally generous — the arch carries fine interior
 * detail (sun, three horizon depth lines, diamond ornament), and at
 * small sizes those details disappear into the champagne. Default
 * md=64 lands in the “unmistakable but not domineering” band; use
 * `lg` as a brand-anchor moment (footer, splash).
 */
export function ArchLogo({ size = 'md', showWordmark = true, className }) {
  const heights = { sm: 44, md: 64, lg: 84 };
  const h = heights[size] || heights.md;

  // Scale typography with the mark — same proportional relationship
  // at every size, so the lock-up reads the same whether 44px or 84px.
  const primaryText = Math.round(h * 0.30);   // 13px → 19px → 25px
  const secondaryText = Math.round(h * 0.19); // 8px  → 12px → 16px

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: Math.round(h * 0.22) + 'px',
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
        style={{ display: 'block', flex: 'none' }}
      >
        <defs>
          <clipPath id="arch-clip">
            <path d="M 80 245 L 80 155 A 80 80 0 0 1 240 155 L 240 245 Z" />
          </clipPath>
        </defs>

        {/* Horizon brackets — thickened so the silhouette reads at small sizes */}
        <line x1="14" y1="245" x2="80" y2="245" stroke="currentColor" strokeWidth="1.4" />
        <line x1="240" y1="245" x2="306" y2="245" stroke="currentColor" strokeWidth="1.4" />

        {/* Arch outline — primary silhouette */}
        <path
          d="M 80 245 L 80 155 A 80 80 0 0 1 240 155 L 240 245"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="square"
          fill="none"
        />

        {/* Interior horizon + sun + ground lines, clipped by the arch.
           Opacities and stroke widths bumped so the inner detail survives
           down to 44px without becoming muddy at 84px. */}
        <g clipPath="url(#arch-clip)">
          <line x1="76" y1="170" x2="244" y2="170" stroke="currentColor" strokeWidth="1.6" />
          <path d="M 132 170 A 28 28 0 0 1 188 170 Z" fill="currentColor" />
          <line x1="96"  y1="192" x2="224" y2="192" stroke="currentColor" strokeWidth="1.2" opacity="0.78" />
          <line x1="104" y1="212" x2="216" y2="212" stroke="currentColor" strokeWidth="1.0" opacity="0.6"  />
          <line x1="116" y1="230" x2="204" y2="230" stroke="currentColor" strokeWidth="0.9" opacity="0.42" />
        </g>

        {/* Diamond ornament above — enlarged so it reads as intentional */}
        <polygon points="160,80 165,86 160,92 155,86" fill="currentColor" />
      </svg>

      {showWordmark && (
        <span
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            gap: '3px',
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-caps)',
            fontWeight: 'var(--weight-regular)',
            letterSpacing: 'var(--tracking-caps)',
            textIndent: 'var(--tracking-caps)',
            textTransform: 'uppercase',
            lineHeight: 1.05,
          }}
        >
          <span style={{ fontSize: primaryText + 'px' }}>Granderson</span>
          <span
            style={{
              fontSize: secondaryText + 'px',
              color: 'var(--color-text-quiet)',
              letterSpacing: 'calc(var(--tracking-caps) * 1.25)',
            }}
          >
            Destinations
          </span>
        </span>
      )}
    </span>
  );
}
