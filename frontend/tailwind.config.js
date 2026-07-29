/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16241C",
        tea: {
          DEFAULT: "#2F5233",
          light: "#6B9362",
          dark: "#1D3520",
        },
        amber: {
          DEFAULT: "#C97A2B",
          light: "#E3A15C",
        },
        cream: "#F5F1E6",
        alert: "#B3452C",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
