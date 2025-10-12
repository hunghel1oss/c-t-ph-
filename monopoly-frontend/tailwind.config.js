/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Graffiti palette - tươi, neon
        neon: {
          pink: '#FF10F0',
          blue: '#00F0FF',
          green: '#39FF14',
          yellow: '#FFFF00',
          orange: '#FF6600',
          purple: '#BF00FF',
        },
        graffiti: {
          dark: '#1a1a2e',
          darker: '#0f0f1e',
          light: '#16213e',
        }
      },
      fontFamily: {
        graffiti: ['"Press Start 2P"', 'cursive'],
        game: ['"Bangers"', 'cursive'],
      },
      boxShadow: {
        'neon': '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
        'neon-strong': '0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'roll': 'roll 0.5s ease-out',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.5)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'roll': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
