import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-surface': '#1a202c',
        'primary': '#edf2f7',
        'secondary': '#a0aec0',
        'accent-primary': '#3b82f6',
        'accent-primary-hover': '#2563eb',
        'on-accent': '#ffffff',
        'border-interactive': '#4a5568',
        'widget': '#2d3748',
      },
      backdropBlur: {
        'xl': '24px',
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      container: {
        screens: {
          micro: '180px',
          compact: '280px',
          standard: '450px',
          detailed: '600px',
          full: '800px',
        },
      },
    },
  },
  plugins: [
    containerQueries,
  ],
};

export default config;
