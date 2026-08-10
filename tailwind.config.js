/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07090a',
          900: '#0b0f0e',
          850: '#0e1412',
          800: '#121917',
          700: '#18211e',
          600: '#212c27',
          500: '#2c3a34',
          400: '#425649',
        },
        signal: {
          50: '#eafcf3',
          100: '#c9f6de',
          200: '#93edbe',
          300: '#5fe09f',
          400: '#39cf85',
          500: '#22b56d',
          600: '#178f57',
          700: '#146f46',
          800: '#12583a',
          900: '#0f4530',
          950: '#082a1e',
        },
        amber: {
          400: '#e8b355',
          500: '#d69a35',
        },
        mist: {
          50: '#f4f7f5',
          100: '#e6ede9',
          200: '#c9d6cf',
          300: '#a3b6ac',
          400: '#7c9184',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(57, 207, 133, 0.25), 0 0 24px -4px rgba(57, 207, 133, 0.35)',
        'glow-lg': '0 0 0 1px rgba(57, 207, 133, 0.3), 0 0 48px -8px rgba(57, 207, 133, 0.45)',
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 20px 40px -20px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        radar: 'radial-gradient(circle at 50% 50%, rgba(57,207,133,0.10) 0%, rgba(7,9,10,0) 60%)',
        scan: 'repeating-linear-gradient(0deg, rgba(57,207,133,0.045) 0px, rgba(57,207,133,0.045) 1px, transparent 1px, transparent 3px)',
        grid: 'linear-gradient(rgba(57,207,133,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(57,207,133,0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '32px 32px',
      },
      animation: {
        sweep: 'sweep 6s linear infinite',
        blink: 'blink 2s ease-in-out infinite',
      },
      keyframes: {
        sweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.35 },
        },
      },
    },
  },
  plugins: [],
}
