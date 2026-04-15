/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0A0E1A",
          secondary: "#111827",
          card: "#1C2333",
        },
        accent: {
          primary: "#3B82F6",
          secondary: "#8B5CF6",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
        },
        txt: {
          primary: "#F9FAFB",
          secondary: "#9CA3AF",
        },
        border: { DEFAULT: "#2D3748" },
      },
      fontFamily: {
        display: ["\"Space Grotesk\"", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["\"JetBrains Mono\"", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.4)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
