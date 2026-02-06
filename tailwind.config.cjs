/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#F97316",
          black: "#0B0B0B",
          white: "#FFFFFF",
        },
      },
    },
  },
  plugins: [],
};
