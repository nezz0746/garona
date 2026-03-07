/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#ffffff",
        card: "#fff5f7",
        surface: "#ffeef2",
        border: "#f0d0d8",
        text: "#1a1a1a",
        "text-secondary": "#666666",
        "text-muted": "#999999",
        primary: "#e91e63",
        "primary-light": "#fce4ec",
        like: "#e91e63",
      },
    },
  },
  plugins: [],
};
