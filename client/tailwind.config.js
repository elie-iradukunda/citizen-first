/* global require */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Legacy public-site tokens (kept so existing public pages keep working)
        ink: '#1d3567',
        mist: '#f3f6fc',
        tide: '#2a4f93',
        pine: '#14366d',
        clay: '#264a88',
        gold: '#ffdd00',
        // Full slate scale (for the Fuel-Loyalty portal look) + legacy DEFAULT (#556786)
        slate: {
          25: '#f8fafc',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
          DEFAULT: '#556786',
        },
        // Fuel-Loyalty inspired brand palette (SP green)
        brand: {
          50: '#ebf8f0',
          100: '#d3efdf',
          200: '#a9dfbf',
          300: '#74c99a',
          400: '#38ad72',
          500: '#0b9b4b',
          600: '#087536',
          700: '#075126',
          800: '#06421f',
          900: '#043016',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 24px rgba(11, 155, 75, 0.12)',
        panel: '0 2px 10px rgba(15, 50, 90, 0.035)',
        card: '0 12px 40px rgba(15, 23, 42, 0.06)',
      },
      backgroundImage: {
        grid: 'radial-gradient(circle at 1px 1px, rgba(16, 32, 51, 0.10) 1px, transparent 0)',
        'brand-radial':
          'radial-gradient(circle at top right, rgba(56, 173, 114, 0.20), transparent 32%), radial-gradient(circle at bottom left, rgba(11, 155, 75, 0.16), transparent 28%)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
