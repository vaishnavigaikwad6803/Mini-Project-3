/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        road: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          amber: '#f59e0b',
          emerald: '#10b981',
          cyan: '#06b6d4',
          danger: '#ef4444',
          subtle: '#64748b',
          light: '#f8fafc'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-amber': '0 0 25px -4px rgba(245, 158, 11, 0.35)',
        'glow-emerald': '0 0 25px -4px rgba(16, 185, 129, 0.35)',
        'glow-cyan': '0 0 25px -4px rgba(6, 182, 212, 0.35)',
        'glow-danger': '0 0 25px -4px rgba(239, 68, 68, 0.35)',
        'card-subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.45)',
        'card-hover': '0 12px 30px -4px rgba(0, 0, 0, 0.6), 0 0 15px -3px rgba(245, 158, 11, 0.15)',
      }
    },
  },
  plugins: [],
}
