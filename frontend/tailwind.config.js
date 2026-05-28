/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // 👈 ensures 'dark:' classes work only when .dark is added
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
