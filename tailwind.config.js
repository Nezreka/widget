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
