/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#125f9f',
          light: '#1a76c0',
          dark: '#0d4a7a',
        },
        accent: '#1499cf',
        'logo-blue': '#125f9f',
        'logo-cyan': '#22b0e0',
      },
    },
  },
  plugins: [],
}
