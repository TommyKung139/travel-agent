/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        pikmin: {
          leaf: "hsl(var(--pikmin-leaf))",
          bloom: "hsl(var(--pikmin-bloom))",
          earth: "hsl(var(--pikmin-earth))",
          sky: "hsl(var(--pikmin-sky))",
          sun: "hsl(var(--pikmin-sun))",
          cream: "hsl(var(--pikmin-cream))",
        }
      },
      fontFamily: {
        display: ['Nunito', 'Noto Sans TC', 'sans-serif'],
        sans: ['Noto Sans TC', 'Nunito', 'sans-serif'],
      },
      boxShadow: {
        soft: "0 4px 20px -4px hsla(142, 45%, 42%, 0.15)",
        card: "0 2px 12px -2px hsla(140, 20%, 15%, 0.08)",
        float: "0 8px 30px -8px hsla(142, 45%, 42%, 0.2)",
      },
      backgroundImage: {
        'gradient-nature': 'linear-gradient(135deg, hsl(142,55%,38%), hsl(160,45%,50%))',
        'gradient-sunset': 'linear-gradient(135deg, hsl(42,90%,62%), hsl(20,80%,60%))',
        'gradient-bloom': 'linear-gradient(135deg, hsl(340,65%,65%), hsl(300,50%,60%))',
      },
      keyframes: {
        'bounce-in': {
          '0%': { transform: 'scale(0)' },
          '80%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'sprout': {
          '0%': { transform: 'scale(0) translateY(10px)' },
          '100%': { transform: 'scale(1) translateY(0)' },
        }
      },
      animation: {
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.26, 1.55) forwards',
        'float': 'float 3s ease-in-out infinite',
        'sprout': 'sprout 0.6s ease-out forwards',
      }
    },
  },
  plugins: [],
}
