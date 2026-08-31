import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fbfaf7',
          100: '#f0eee8',
          200: '#dfddd6',
          300: '#c4c1b9',
          400: '#9a9790',
          500: '#6f6d68',
          600: '#373633',
          700: '#171717',
          800: '#111111',
          900: '#0a0a0a',
          950: '#050505',
        },
        accent: {
          50: '#f5f0e7',
          100: '#ebdfca',
          300: '#c4a46d',
          500: '#9a743a',
          600: '#805e2e',
        },
      },
      fontFamily: {
        // Brand typography is bundled in the app. Never rely on the browser's
        // platform font for the Booxury interface.
        serif: ['"Playfair Display Variable"', '"Playfair Display"', 'serif'],
        sans: ['"DM Mono"', 'monospace'],
        mono: ['"DM Mono"', 'monospace'],
      },
      keyframes: {
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
