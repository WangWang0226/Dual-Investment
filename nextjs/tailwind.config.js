/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#fbbf24',
        secondary: '#3965a2',
        deepBlue: '#38538d'
      },
      backgroundImage: {
        'wallpaper3': "url('/bg-photo3.jpeg')",
        'projectIcon': "url('/projectIcon.jpeg')",
      }
    },
  },
  plugins: [],
};
