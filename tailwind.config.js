/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: '#121212',
        rosegold: '#E0BFB8',
        navy: '#0A192F',
        maroon: '#800020', // Premium Deep Red
        gold: '#C5A059',   // Luxury Gold accent
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        signature: ['Great Vibes', 'cursive'],
      },
    },
  },
  plugins: [],
}
