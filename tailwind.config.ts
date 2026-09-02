import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        madera: "#2b1b12",
        madera2: "#3a2418",
        crema: "#f8ecc9",
        crema2: "#eddcb0",
        marron: "#4a2415",
        dorado: "#d8a53a",
        rojo: "#b1291f",
        verde: "#45601f",
      },
      fontFamily: {
        narrow: ['"Arial Narrow"', '"Helvetica Neue"', "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
