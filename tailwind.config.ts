import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        discord: {
          blurple: "#5865F2",
          dark: "#2b2d31",
          darker: "#1e1f22",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
