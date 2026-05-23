import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bone: "#F3F0E9",
        card: "#FBFAF7",
        paper: "#FFFFFF",
        hairline: "#E4DFD4",
        ink: "#1C1B19",
        muted: "#6A6358",
        tint: "#E8E2D4"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        // Display and "serif" both alias to Inter now — keeps any callers
        // that referenced font-serif from breaking.
        serif: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      letterSpacing: {
        tightish: "-0.018em",
        tighter2: "-0.028em",
        ink: "-0.045em"
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.06)"
      },
      maxWidth: {
        prose2: "62ch"
      }
    }
  },
  plugins: []
};

export default config;
