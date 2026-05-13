/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        }
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        }
      },
      fontFamily: {
        inter: ['var(--font-inter)']
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  safelist: [
    'bg-emerald-100', 'text-emerald-700', 'bg-amber-100', 'text-amber-700',
    'bg-red-100', 'text-red-700', 'bg-blue-100', 'text-blue-700',
    'bg-purple-100', 'text-purple-700', 'bg-emerald-50', 'bg-emerald-300',
    'bg-blue-50', 'bg-blue-300', 'text-blue-800', 'bg-purple-50', 'bg-purple-300', 'text-purple-800',
    'bg-green-100', 'bg-green-300', 'text-green-800', 'bg-amber-300', 'text-amber-800',
    'bg-red-300', 'text-red-800', 'bg-orange-100', 'bg-orange-300', 'text-orange-800',
    'bg-pink-100', 'bg-pink-300', 'text-pink-800', 'bg-indigo-100', 'bg-indigo-300', 'text-indigo-800',
    'bg-slate-100', 'bg-slate-300', 'text-slate-800', 'bg-emerald-100', 'bg-emerald-300', 'text-emerald-800',
    'bg-cyan-100', 'bg-cyan-300', 'text-cyan-800', 'bg-yellow-100', 'bg-yellow-300', 'text-yellow-800',
    'bg-orange-50', 'bg-orange-200', 'text-orange-700',
    'border-blue-300', 'border-purple-300', 'border-green-300', 'border-amber-300',
    'border-red-300', 'border-orange-300', 'border-pink-300', 'border-indigo-300',
    'border-slate-300', 'border-emerald-300', 'border-cyan-300', 'border-yellow-300', 'border-orange-200',
    'border-blue-200', 'border-purple-200', 'border-emerald-200',
  ],
  plugins: [require("tailwindcss-animate")],
}