/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './**/*.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3368A0',
          hover: '#2a5585',
          light: '#66A3BF',
          lighter: '#C8DFDB',
        },
        bg: '#F2EFE7',
        dark: '#1a2a3a',
        // Replace amber with primary
        amber: {
          50: '#F2EFE7',
          100: '#E8E0D8',
          200: '#C8DFDB',
          300: '#66A3BF',
          400: '#3368A0',
          500: '#3368A0',
          600: '#2a5585',
          700: '#2a5585',
          800: '#2a5585',
          900: '#2a5585',
        },
        orange: {
          50: '#C8DFDB',
          100: '#C8DFDB',
          200: '#66A3BF',
          300: '#3368A0',
          400: '#3368A0',
          500: '#3368A0',
          600: '#2a5585',
        },
      },
      fontFamily: {
        sans: ['Satoshi', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}