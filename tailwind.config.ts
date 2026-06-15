import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#050505",
          900: "#0a0a0a",
          850: "#0d0d0d",
          800: "#111111",
          700: "#171717",
          600: "#1f1f1f",
          500: "#2a2a2a",
        },
        silver: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.03em",
        luxe: "0.35em",
      },
      animation: {
        marquee: "marquee 35s linear infinite",
        "fade-in": "fadeIn 0.6s ease-out both",
        "fade-up": "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundImage: {
        "silver-gradient":
          "linear-gradient(135deg,#fafafa 0%,#a1a1aa 50%,#fafafa 100%)",
        "noise":
          "radial-gradient(circle at 50% 50%, transparent 0, rgba(0,0,0,0.4) 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
