/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1d3567',
        mist: '#f3f6fc',
        tide: '#2a4f93',
        pine: '#14366d',
        clay: '#264a88',
        gold: '#ffdd00',
        slate: '#556786',
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        display: ['"Montserrat"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 22px 65px rgba(20, 41, 84, 0.15)',
      },
      backgroundImage: {
        grid: 'radial-gradient(circle at 1px 1px, rgba(16, 32, 51, 0.10) 1px, transparent 0)',
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
  plugins: [],
};
