/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB", // Aegean Blue
        secondary: "#F43F5E", // Vibrant Rose
        background: "#F8FAFC", // Vista Blue background
      },
      fontFamily: {
        serif: ["'Playfair Display'", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        'puffy': '0 20px 40px -10px rgba(37, 99, 235, 0.15)',
        'deep': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
