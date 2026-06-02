/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#f4f0e7',
        taupe: '#d4cbc4',
        gold: '#978152',
        sage: '#6b7050',
        wine: '#4c2233',
        ink: '#2d2020',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(44, 34, 51, 0.04), 0 4px 16px rgba(44, 34, 51, 0.06)',
        panel: '0 1px 3px rgba(44, 34, 51, 0.05), 0 8px 24px rgba(44, 34, 51, 0.08)',
        elevated: '0 4px 6px rgba(44, 34, 51, 0.05), 0 16px 40px rgba(44, 34, 51, 0.12)',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"Jost"', 'sans-serif'],
        script: ['"Dancing Script"', 'cursive'],
      },
      backgroundImage: {
        'floral-pattern': "url('/patterns/floral-bg.svg')",
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
