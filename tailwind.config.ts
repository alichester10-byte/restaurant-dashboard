import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#14211b",
        sand: "#f6f0e6",
        moss: "#214c3d",
        sage: "#6f8a72",
        gold: "#c99839",
        mist: "#edf1ea",
        danger: "#ae4f3d"
      },
      boxShadow: {
        soft: "0 12px 40px rgba(20, 33, 27, 0.08)"
      },
      borderRadius: {
        xl2: "1.5rem"
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(20,33,27,0.05) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;
