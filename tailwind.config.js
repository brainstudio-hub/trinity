/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", md: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        // Paleta institucional (tas.edu)
        tas: {
          ink: "#1F1B13",
          cream: "#FFF8F1",
          paper: "#FBF8F3",
          stone: "#EAE1D4",
          sand: "#F3EDE4",
          taupe: "#6B6356",
          crimson: "#CD1543",
          "crimson-dark": "#A50F35",
          navy: "#00243A",
          "navy-deep": "#051721",
          "navy-mid": "#003155",
          blue: "#004990",
          gold: "#F2AF00",
          "gold-soft": "#FAF0CE",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(31,27,19,0.04), 0 2px 8px rgba(31,27,19,0.04)",
        lift: "0 2px 4px rgba(31,27,19,0.04), 0 12px 32px -8px rgba(31,27,19,0.12)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "fade-up": "fade-up 0.3s ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      typography: ({ theme }) => ({
        tas: {
          css: {
            "--tw-prose-body": theme("colors.tas.ink"),
            "--tw-prose-headings": theme("colors.tas.navy"),
            "--tw-prose-links": theme("colors.tas.blue"),
            "--tw-prose-bold": theme("colors.tas.ink"),
            "--tw-prose-bullets": theme("colors.tas.taupe"),
            "--tw-prose-counters": theme("colors.tas.taupe"),
            "--tw-prose-quotes": theme("colors.tas.navy"),
            "--tw-prose-quote-borders": theme("colors.tas.crimson"),
            "--tw-prose-hr": theme("colors.tas.stone"),
            "--tw-prose-th-borders": theme("colors.tas.stone"),
            "--tw-prose-td-borders": theme("colors.tas.stone"),
          },
        },
      }),
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
