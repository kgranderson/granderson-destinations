/** @type {import('tailwindcss').Config} */
//
// The Tailwind palette mirrors the design-system tokens declared in
// src/styles/tokens.css. Hex values here ARE permitted because this
// is a build-time configuration file, not component CSS — the source
// of truth remains tokens.css; this file simply exposes those values
// to Tailwind's opacity-modifier syntax (`bg-brand-tan/40`).
//
// If you change a value in tokens.css, change it here too. Never
// introduce a hex value in a .jsx or component .css file.
//
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Surfaces (mirrors --c-ink-* and --c-bone-* from tokens.css)
          ink:       '#0E1116', // --c-ink-1000
          'ink-900': '#15191F',
          'ink-800': '#1E232B',
          cloud:     '#F2EAD8', // --c-bone-100 (default light surface)
          sand:      '#E8DFC8', // --c-bone-200 (raised surface)
          tan:       '#D9CFB8', // --c-bone-300 (subtle border)
          'bone-400':'#B5AC97',

          // Text on light surfaces — kept ink-deep so the body reads AAA on bone
          slate:     '#3A4049', // --c-ink-600

          // Accent (champagne, the one brand color)
          gold:      '#C9A86A', // --c-champagne-500
          'gold-soft':'#D6B97E',
          'gold-deep':'#B89859',

          // Property accents — used in section-scoped tints, never the master mark
          terracotta:'#B86F4A', // --c-terracotta-500
          jade:      '#7A8B7F', // --c-sage-500
          rose:      '#E8DFC8', // legacy alias (kept so admin pages render)
        },
      },

      fontFamily: {
        sans:    ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        body:    ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Cormorant Garamond', 'Georgia', 'serif'],
        caps:    ['var(--font-caps)', 'Cormorant SC', 'Georgia', 'serif'],
        mono:    ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        // Display sizes use the +0.04em tracking spec from the design system.
        'display-xl': ['clamp(3rem, 7vw, 6rem)',     { lineHeight: '1.0',  letterSpacing: '0.02em' }],
        'display-lg': ['clamp(2.25rem, 5vw, 4.5rem)', { lineHeight: '1.05', letterSpacing: '0.02em' }],
        'display-md': ['clamp(1.75rem, 3.5vw, 3rem)', { lineHeight: '1.1',  letterSpacing: '0.02em' }],
      },

      // Elevation is muted — the design system relies on hairlines, not shadow stacks.
      boxShadow: {
        soft:  '0 1px 2px rgba(14, 17, 22, 0.04), 0 1px 1px rgba(14, 17, 22, 0.06)',
        lift:  '0 4px 12px rgba(14, 17, 22, 0.08), 0 2px 4px rgba(14, 17, 22, 0.10)',
        modal: '0 12px 32px rgba(14, 17, 22, 0.16), 0 4px 8px rgba(14, 17, 22, 0.12)',
        inset: 'inset 0 1px 0 rgba(242, 234, 216, 0.06)',
      },

      borderRadius: {
        none: '0',
        xs:   '2px',
        sm:   '4px',
        pill: '999px',
      },

      transitionTimingFunction: {
        'out-expo':  'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },

      transitionDuration: {
        fast:   '200ms',
        base:   '320ms',
        slow:   '560ms',
        reveal: '800ms',
      },

      keyframes: {
        pageIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },

      animation: {
        'page-in': 'pageIn 560ms cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer:   'shimmer 1.8s linear infinite',
      },
    },
  },
  plugins: [],
};
