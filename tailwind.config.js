/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand: Violet family (tenant-hub design system)
        primary: {
          50:  "#F5F3FF", // violet-50
          100: "#EDE9FE", // violet-100
          200: "#DDD6FE", // violet-200
          300: "#C4B5FD", // violet-300
          500: "#8B5CF6", // violet-500
          600: "#7C3AED", // violet-600 — PRIMARY BRAND
          700: "#6D28D9", // violet-700
          DEFAULT: "#7C3AED",
          hover:   "#6D28D9",
          text:    "#6D28D9",
        },
        // Neutral surfaces (tenant-hub tonal layering)
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#FAFAFA",     // neutral-50
        },
        background: "#FFFFFF",  // canvas white (Light mode) — CSS var controls the actual value
        // Neutral scale aligned with Tailwind neutral (replaces old gray purple scale)
        gray: {
          50:  "#FAFAFA", // neutral-50
          100: "#F5F5F5", // neutral-100
          200: "#E5E5E5", // neutral-200
          300: "#D4D4D4", // neutral-300
          400: "#A3A3A3", // neutral-400
          500: "#737373", // neutral-500
          600: "#525252", // neutral-600
          700: "#404040", // neutral-700
          800: "#262626", // neutral-800
          900: "#171717", // neutral-900
          950: "#0A0A0A", // neutral-950
        },
        // Semantic status (tenant-hub Tailwind v4 green/yellow/red/blue palette)
        success: {
          50:  "#F0FDF4", // green-50
          100: "#DCFCE7", // green-100
          500: "#22C55E", // green-500
          600: "#16A34A", // green-600 — BRAND SUCCESS
          DEFAULT: "#16A34A",
        },
        warning: {
          50:  "#FEFCE8", // yellow-50
          100: "#FEF9C3", // yellow-100
          500: "#EAB308", // yellow-500
          600: "#CA8A04", // yellow-600 — BRAND WARNING
          DEFAULT: "#CA8A04",
        },
        danger: {
          50:  "#FEF2F2", // red-50
          100: "#FEE2E2", // red-100
          500: "#EF4444", // red-500
          600: "#DC2626", // red-600 — BRAND DANGER
          DEFAULT: "#DC2626",
        },
        error: {
          50:  "#FEF2F2",
          100: "#FEE2E2",
          500: "#EF4444",
          600: "#DC2626",
          DEFAULT: "#DC2626",
        },
        info: {
          50:  "#EFF6FF", // blue-50
          100: "#DBEAFE", // blue-100
          500: "#3B82F6", // blue-500
          600: "#2563EB", // blue-600 — BRAND INFO
          DEFAULT: "#2563EB",
        },
      },
      fontFamily: {
        // UI Shell Font: Inter (EN) + Noto Sans Thai (TH) — matches tenant-hub design system
        sans: ["var(--font-inter)", "Inter", "var(--font-noto-thai)", "Noto Sans Thai", "ui-sans-serif", "system-ui", "sans-serif"],
        // Legacy named families kept for any existing component references
        sora: ["var(--font-inter)", "Inter", "sans-serif"],
        "noto-looped": ["var(--font-noto-thai-looped)", "Noto Sans Thai Looped", "sans-serif"],
      },
      borderRadius: {
        sm:      "4px",   // checkbox
        DEFAULT: "8px",   // control: buttons, inputs (tenant-hub --radius-control)
        button:  "8px",
        input:   "8px",
        card:    "12px",  // tenant-hub --radius-card
        panel:   "16px",  // tenant-hub --radius-panel
        lg:      "12px",
        badge:   "9999px",
      },
      boxShadow: {
        // tenant-hub elevation scale
        field:  "inset 0 0 0 1px #D4D4D4, 0 1px 2px rgba(16, 24, 40, 0.05)",
        card:   "0 1px 2px rgba(0,0,0,0.04), 0 1px 8px rgba(0,0,0,0.04)",
        panel:  "0 8px 32px rgba(0,0,0,0.10)",
        // kept for any existing component references
        "deal-card": "0 1px 4px rgba(0, 0, 0, 0.06)",
        document:    "0 4px 16px rgba(15, 23, 42, 0.08)",
      },
      spacing: {
      },
      width: {
        sidebar:           "260px", // tenant-hub --sidebar-width
        "sidebar-collapsed": "72px",
      },
    },
  },
  plugins: [],
};

