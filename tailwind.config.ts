import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Identidade Bagaúste Bar (extraída do logotipo)
        brand: {
          orange: "#F15A22",
          orangeLight: "#F7941D",
          navy: "#1F2D44",
          navyDark: "#16212F",
          cream: "#FBF7F2",
          sand: "#F3ECE3",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
