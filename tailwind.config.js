/**
 * Tailwind config for Tadabbur.
 *
 * The site ships a prebuilt `tailwind.css` so no build step is needed to host it —
 * GitHub Pages serves the repo as-is. Rebuild after changing classes in index.html:
 *
 *   npm install
 *   npm run build:css
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  darkMode: 'class',
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        'background-light': '#f4f6fb',
        'background-dark': '#0b1120',
        'card-light': '#ffffff',
        'card-dark': '#16213a',
        'text-light': '#0f172a',
        'text-dark': '#e2e8f0',
        'subtle-text-light': '#64748b',
        'subtle-text-dark': '#94a3b8',
        'border-light': '#e2e8f0',
        'border-dark': '#2a3752'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        amiri: ['Amiri Quran', 'serif']
      }
    }
  },
  plugins: []
};
