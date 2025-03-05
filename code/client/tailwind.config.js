/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FF6532",
        secondary: "#111827",
        light: "#6C7278",
        dark: "#310C00"
      }
    },
  },
  plugins: [],
}

