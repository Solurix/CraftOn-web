import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#1f6feb", dark: "#1a5fd0", soft: "#eaf1fe" },
      },
    },
  },
  plugins: [],
} satisfies Config;
