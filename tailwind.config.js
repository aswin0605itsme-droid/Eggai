/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      animation: {
        'slide-in-fade-up': 'slideInFadeUp 0.5s ease-in-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathing-border': 'breathing 2.5s ease-in-out infinite',
      },
      keyframes: {
        slideInFadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
        breathing: {
          '0%, 100%': { 'box-shadow': '0 0 0 0px rgba(59, 130, 246, 0.5)' }, // Corresponds to blue-500
          '50%': { 'box-shadow': '0 0 0 8px rgba(59, 130, 246, 0)' },
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};