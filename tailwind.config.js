/** @type {import('tailwindcss').Config} */
export default {
  content: ["./frontend/index.html", "./frontend/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        parchment: {
          DEFAULT: "#F4EBDD",
          light: "#FAF7F0",
          dark: "#E8DCC8",
        },
        espresso: {
          DEFAULT: "#2A211B",
          light: "#3A2E26",
        },
        charcoal: "#302B26",
        olive: {
          DEFAULT: "#3F4A36",
          light: "#576347",
        },
        mustard: {
          DEFAULT: "#C49A45",
          light: "#D6B36B",
          dark: "#A67F34",
        },
        terracotta: {
          DEFAULT: "#B65F45",
          light: "#C97C63",
        },
        dustyred: "#9B4D3A",
        teal: {
          DEFAULT: "#557C78",
          light: "#6D9A95",
          dark: "#41615D",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        serif: ["'DM Serif Display'", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      backgroundImage: {
        grain: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        paper: "0 1px 2px rgba(42, 33, 27, 0.06), 0 4px 16px rgba(42, 33, 27, 0.06)",
        "paper-lg": "0 2px 4px rgba(42, 33, 27, 0.08), 0 12px 32px rgba(42, 33, 27, 0.10)",
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
