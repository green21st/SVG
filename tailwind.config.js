/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#020617', // slate-950
        foreground: '#f8fafc', // slate-50
        primary: '#22d3ee', // cyan-400
        secondary: '#94a3b8', // slate-400
        accent: '#38bdf8', // sky-400
        surface: '#0f172a', // slate-900
        border: '#1e293b', // slate-800
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

