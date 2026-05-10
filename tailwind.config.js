/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — luxury short-term rental, warm desert + colonial earth
        brand: {
          ink: '#0E1116',        // primary text / deep navy
          sand: '#F5EFE6',       // hero cream
          tan: '#E8DCC6',
          terracotta: '#C6633C', // Palm Springs accent
          jade: '#5E7C6B',       // San Miguel accent (talavera green)
          gold: '#C9A24E',       // CTA / premium
          rose: '#D98E78',
          slate: '#3F4A56',
          cloud: '#FAFAF7',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      fontSize: {
        'display-xl': ['clamp(3rem, 7vw, 6rem)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2.25rem, 5vw, 4.5rem)', { lineHeight: '1.02', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(1.75rem, 3.5vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(14, 17, 22, 0.04), 0 8px 24px rgba(14, 17, 22, 0.06)',
        lift: '0 2px 4px rgba(14, 17, 22, 0.06), 0 24px 48px rgba(14, 17, 22, 0.10)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      transitionTimingFunction: {
        'out-quint': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out-quint': 'cubic-bezier(0.83, 0, 0.17, 1)',
      },
      keyframes: {
        pageIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'page-in': 'pageIn 480ms cubic-bezier(0.23, 1, 0.32, 1) both',
        shimmer: 'shimmer 1.8s linear infinite',
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [],
};
