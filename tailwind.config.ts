import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sacku: {
          emerald: "#176B50",
          deep: "#164F3E",
          sage: "#E8F1EB",
          gold: "#C5A15B",
          paper: "#FAFBF9",
          ink: "#252B27",
          muted: "#737B75",
          border: "#E7EBE7",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Manrope", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
