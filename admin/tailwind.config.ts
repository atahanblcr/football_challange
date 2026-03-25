import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        surface: '#1E293B',
        'surface-variant': '#334155',
        primary: '#1A56DB',
        correct: '#10B981',
        wrong: '#EF4444',
        warning: '#F59E0B',
      },
    },
  },
  plugins: [],
} satisfies Config;
