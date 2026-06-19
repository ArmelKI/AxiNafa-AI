import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Identité AxiNafa — accent vert-bleu sobre et pro
        brand: {
          DEFAULT: "#1B5E5A",
          50: "#E8F2F1",
          100: "#C9E0DE",
          200: "#9CC6C2",
          300: "#6FACA7",
          400: "#42928B",
          500: "#1B5E5A",
          600: "#164D49",
          700: "#113B38",
          800: "#0B2A28",
          900: "#061817",
        },
        accent: "#E2A03F",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
