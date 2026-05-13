/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        floatUp: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-20px)' },
        },
        fadeInOut: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.95)' },
          '10%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '80%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-10px) scale(0.95)' },
        },
        flipReveal: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
      },
      animation: {
        'float-up': 'floatUp 1.5s ease-out forwards',
        'fade-in-out': 'fadeInOut 6s ease-in-out forwards',
        'flip-in': 'flipIn 0.5s ease-out forwards',
        'flip-reveal': 'flipReveal 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
}