/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'toeic-blue': '#1e40af',
        'toeic-light': '#3b82f6',
        'success': '#10b981',
        'error': '#ef4444',
      }
    },
  },
  plugins: [],
}
