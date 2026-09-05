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
      },
      boxShadow: {
        'glow-amber': '0 0 20px -5px rgba(245, 158, 11, 0.3)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.3)',
        'glow-danger': '0 0 20px -5px rgba(239, 68, 68, 0.3)',
      }
    },
  },
  plugins: [],
}
