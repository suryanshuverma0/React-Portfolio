/** @type {import('tailwindcss').Config} */
export default {
  darkMode:'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 15px 5px rgba(255, 255, 255, 0.2)', 
      },
    },
  },
  plugins: [],
}