import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "Segoe UI", "sans-serif"],
        display: ["var(--font-jakarta)", "Segoe UI", "sans-serif"]
      },
      colors: {
        brand: {
          50: "#f0fdf9",
          100: "#ccfbef",
          500: "#14b8a0",
          600: "#0d9488",
          700: "#0f766e"
        }
      }
    }
  },
  plugins: []
};

export default config;
