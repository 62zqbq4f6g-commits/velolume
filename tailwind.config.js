/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ========================================
      // VELOLUME NOIR - Soho Color Palette
      // ========================================
      colors: {
        // Dirty Purple foundation
        velolume: {
          DEFAULT: "#3D2B3D",
          50: "#F5F2F5",
          100: "#E8E0E8",
          200: "#C9B8C9",
          300: "#A890A8",
          400: "#876887",
          500: "#3D2B3D",    // Main dirty purple
          600: "#2D1F2D",    // Darker
          700: "#1F151F",
          800: "#120C12",
          900: "#080508",
        },
        // Mocha Mousse accents
        mocha: {
          DEFAULT: "#A38A7E",
          50: "#FAF8F7",
          100: "#F0EBE8",
          200: "#DFD4CE",
          300: "#CEBDB3",
          400: "#BFA393",    // Hover state
          500: "#A38A7E",    // Main mocha
          600: "#8B7567",
          700: "#6E5C51",
          800: "#51443C",
          900: "#352D28",
        },
        // Off-white text
        ivory: {
          DEFAULT: "#F5F5F5",
          50: "#FFFFFF",
          100: "#F5F5F5",    // Primary text
          200: "#E8E8E8",
          300: "#D4D4D4",
          400: "#B8A8B8",    // Muted lavender
          500: "#9A8A9A",
        },
        // ========================================
        // STUDIO DASHBOARD - Clean Agency Palette
        // ========================================
        studio: {
          white: "#FBFBFB",   // Studio White - main background
          DEFAULT: "#FBFBFB",
        },
        industrial: {
          grey: "#E5E5E5",    // Industrial Grey - borders/dividers
          light: "#F5F5F5",   // Light variant
          dark: "#6B7280",    // Dark text
          DEFAULT: "#E5E5E5",
        },
      },

      // ========================================
      // SOHO TYPOGRAPHY
      // ========================================
      fontFamily: {
        // Serif for editorial headers - "Artistic Vision"
        serif: ["'Playfair Display'", "'Young Serif'", "Georgia", "serif"],
        // Mono for data precision - "Technical Authority"
        mono: ["'JetBrains Mono'", "'Fira Code'", "'SF Mono'", "monospace"],
        // Sans for body
        sans: ["'Inter'", "'SF Pro Display'", "system-ui", "sans-serif"],
      },

      fontSize: {
        // Editorial scale
        "display-xl": ["clamp(3rem, 8vw, 6rem)", { lineHeight: "0.95", letterSpacing: "-0.02em" }],
        "display": ["clamp(2.5rem, 6vw, 4.5rem)", { lineHeight: "1", letterSpacing: "-0.02em" }],
        "headline": ["clamp(1.75rem, 4vw, 2.5rem)", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
        "subhead": ["clamp(1.25rem, 2vw, 1.5rem)", { lineHeight: "1.3" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        "body": ["1rem", { lineHeight: "1.6" }],
        "caption": ["0.875rem", { lineHeight: "1.5" }],
        "micro": ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.02em" }],
      },

      // ========================================
      // ASYMMETRIC SPACING
      // ========================================
      spacing: {
        "asymmetric": "clamp(2rem, 8vw, 6rem)",
        "breathing": "clamp(3rem, 10vh, 8rem)",
        "editorial": "clamp(1.5rem, 4vw, 3rem)",
        "gallery": "clamp(1rem, 3vw, 2rem)",
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
      },

      // ========================================
      // GLASS MORPHISM & SHADOWS
      // ========================================
      backdropBlur: {
        glass: "16px",
        "glass-heavy": "24px",
      },

      boxShadow: {
        "soft": "0 4px 20px rgba(0, 0, 0, 0.15)",
        "dramatic": "0 8px 40px rgba(0, 0, 0, 0.3)",
        "gummy": "0 8px 32px rgba(163, 138, 126, 0.2)",
        "glass": "0 4px 30px rgba(0, 0, 0, 0.1)",
        "inner-glow": "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
      },

      // ========================================
      // EDITORIAL ANIMATIONS
      // ========================================
      animation: {
        "fade-in": "fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-up": "slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in-right": "slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        "scale-in": "scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "float": "float 6s ease-in-out infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },

      // ========================================
      // TRANSITION TIMING
      // ========================================
      transitionTimingFunction: {
        "editorial": "cubic-bezier(0.4, 0, 0.2, 1)",
        "bounce-soft": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },

      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
      },

      // ========================================
      // BORDER RADIUS - Gummy UI
      // ========================================
      borderRadius: {
        "gummy": "1.5rem",
        "gummy-sm": "1rem",
        "gummy-lg": "2rem",
        "gummy-xl": "2.5rem",
      },
    },
  },
  plugins: [],
};
