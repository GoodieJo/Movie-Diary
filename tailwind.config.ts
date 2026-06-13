import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50:  "#fefdf8",
          100: "#fdf8ec",
          200: "#faf0d7",
          300: "#f5e4b8",
          400: "#edd494",
          500: "#e3be6a",
        },
        rose: {
          50:  "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
        },
        warm: {
          50:  "#faf7f4",
          100: "#f5ede4",
          200: "#ead8c8",
          300: "#dbbfa6",
          400: "#c99f7f",
          500: "#b8825e",
        },
        parchment: "#f8f3e8",
        ink: "#3d2b1f",
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'Lato'", "system-ui", "sans-serif"],
        handwriting: ["'Dancing Script'", "cursive"],
      },
      boxShadow: {
        paper: "0 2px 8px rgba(61,43,31,0.08), 0 1px 3px rgba(61,43,31,0.05)",
        card:  "0 4px 20px rgba(61,43,31,0.10), 0 2px 6px rgba(61,43,31,0.06)",
        lift:  "0 8px 30px rgba(61,43,31,0.14), 0 3px 8px rgba(61,43,31,0.08)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "paper-texture": "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "float-delay": "float 7s ease-in-out 2s infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-12px)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
