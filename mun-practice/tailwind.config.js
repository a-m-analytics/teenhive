/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        ink: {
          950: '#08080f',
          900: '#0d0c16',
          800: '#12111d',
          700: '#191826',
          600: '#221f33',
          500: '#2d2a42',
        },
        gold: {
          200: '#f9e4a6',
          300: '#f2ca6c',
          400: '#e8b84d',
          500: '#c9973a',
          600: '#a87a28',
        },
        cobalt: {
          300: '#93a9ff',
          400: '#6b84f5',
          500: '#3d5af1',
          600: '#2d4ae0',
        },
        teal: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
        },
      },
      animation: {
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'pulse-slow': 'pulse 5s ease-in-out infinite',
        float: 'float 8s ease-in-out infinite',
        'float-alt': 'floatAlt 11s ease-in-out infinite',
        ticker: 'ticker 40s linear infinite',
        shimmer: 'shimmer 3s linear infinite',
        'fade-up': 'fadeUp 0.5s ease-out forwards',
      },
      keyframes: {
        pulseDot: {
          '0%,100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.4)', opacity: '1' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(1deg)' },
        },
        floatAlt: {
          '0%,100%': { transform: 'translateY(-6px)' },
          '50%': { transform: 'translateY(10px)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
