/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
       fontFamily: {
        sans: ['Inter', 'sans-serif'],
        playfair: ['"Playfair Display"', 'serif'],
        orbitron: ['Orbitron', 'sans-serif'],
        oswald: ['Oswald', 'sans-serif'],
        anton: ['Anton', 'sans-serif'],
        dancing: ['"Dancing Script"', 'cursive'],
        notojp: ['"Noto Serif JP"', 'serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        lato: ['Lato', 'sans-serif'],
      },
      textShadow: {
        'lg': '0 2px 10px rgba(0, 0, 0, 0.5)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
      }
    },
  },
  plugins: [
      function({ addUtilities }) {
          addUtilities({
              '.text-shadow-lg': {
                  'text-shadow': '0 2px 10px rgba(0, 0, 0, 0.5)',
              }
          })
      }
  ],
}