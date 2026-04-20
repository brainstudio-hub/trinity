/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom colors from design reference
        "tertiary-fixed-dim": "#ffb691",
        "surface-variant": "#e0e3e5",
        "on-tertiary-container": "#f59561",
        "tertiary": "#4c1d00",
        "surface-dim": "#d8dadc",
        "on-error-container": "#93000a",
        "surface-container-lowest": "#ffffff",
        "on-background": "#191c1e",
        "surface-container": "#eceef0",
        "primary-fixed": "#d6e3ff",
        "on-primary-fixed-variant": "#0e4686",
        "on-primary-container": "#83aef5",
        "error": "#ba1a1a",
        "outline-variant": "#c3c6d2",
        "inverse-primary": "#a9c7ff",
        "inverse-on-surface": "#eff1f3",
        "error-container": "#ffdad6",
        "tertiary-fixed": "#ffdbcb",
        "on-secondary-fixed-variant": "#2e4b57",
        "on-tertiary-fixed-variant": "#773305",
        "on-tertiary-fixed": "#341100",
        "secondary-fixed": "#c9e7f7",
        "on-surface-variant": "#424750",
        "surface-tint": "#305ea0",
        "on-error": "#ffffff",
        "surface-container-low": "#f2f4f6",
        "on-primary": "#ffffff",
        "surface-container-highest": "#e0e3e5",
        "outline": "#737781",
        "on-secondary-fixed": "#001f2a",
        "on-secondary": "#ffffff",
        "primary-fixed-dim": "#a9c7ff",
        "primary-container": "#004080",
        "on-secondary-container": "#4a6774",
        "on-tertiary": "#ffffff",
        "surface": "#f8f9fb",
        "secondary-container": "#c6e4f4",
        "on-surface": "#191c1e",
        "tertiary-container": "#6f2d00",
        "on-primary-fixed": "#001b3d",
        "inverse-surface": "#2d3133",
        "surface-container-high": "#e6e8ea",
        "surface-bright": "#f8f9fb",
        "secondary-fixed-dim": "#adcbda"
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "0.75rem",
        full: "9999px"
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"]
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out"
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
