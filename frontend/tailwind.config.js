/** Tailwind CSS configuration for the earth- terminal aesthetic. */

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', '"IBM Plex Mono"', "monospace"],
      },
      colors: {
        panel: {
          bg: "#000000",
          border: "#333333",
          text: "#FFFFFF",
          muted: "#AAAAAA",
          error: "#FF4444",
          warn: "#FFAA00",
          success: "#00FF00",
        },
      },
    },
  },
  plugins: [],
};
