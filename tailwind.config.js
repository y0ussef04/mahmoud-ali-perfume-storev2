/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ثوابت الهوية وتوافق الأدمن والمحل
        lacquer: 'rgb(var(--c-lacquer) / <alpha-value>)',
        brass: {
          DEFAULT: 'rgb(var(--c-brass) / <alpha-value>)',
          light: 'rgb(var(--c-brass-light) / <alpha-value>)',
          gilt: 'rgb(var(--c-brass-gilt) / <alpha-value>)',
        },
        frost: 'rgb(var(--c-frost) / <alpha-value>)',
        espresso: 'rgb(var(--c-espresso) / <alpha-value>)',
        page: 'rgb(var(--c-page) / <alpha-value>)',
        glass: 'rgb(var(--c-glass) / <alpha-value>)',
        elevated: 'rgb(var(--c-elevated) / <alpha-value>)',
        oud: 'rgb(var(--c-oud) / <alpha-value>)',
        garnet: 'rgb(var(--c-garnet) / <alpha-value>)',
        sage: 'rgb(var(--c-sage) / <alpha-value>)',
        'success-solid': 'rgb(var(--c-success-solid) / <alpha-value>)',
        'danger-solid': 'rgb(var(--c-danger-solid) / <alpha-value>)',
        'ink-60': 'var(--c-ink-60)',
        'ink-42': 'var(--c-ink-42)',
        hair: 'var(--c-hair)',
        'hair-soft': 'var(--c-hair-soft)',

        // تسميات متجر الكلاسيكية
        surface: 'rgb(var(--c-glass) / <alpha-value>)',
        'border-warm': 'var(--c-hair-soft)',
        'text-primary': 'rgb(var(--c-oud) / <alpha-value>)',
        'text-muted': 'var(--c-ink-60)',
        gold: {
          DEFAULT: '#C9A84C',
          dark: '#8B6914',
        },
        'success-green': '#2D6A4F',
        'danger-red': '#9B1C1C',
      },
      fontFamily: {
        sans: ['var(--f-sans)', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        display: ['var(--f-sans)', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        body: ['var(--f-sans)', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        mark: ['var(--f-sans)', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs2: ['0.75rem', { lineHeight: '1.5' }],     // 12px
        xs1: ['0.85rem', { lineHeight: '1.55' }],    // 13.6px
        xs: ['0.75rem', { lineHeight: '1.4' }],      // 12px
        sm: ['0.875rem', { lineHeight: '1.5' }],     // 14px
        base: ['1rem', { lineHeight: '1.7' }],       // 16px
        lg: ['1.125rem', { lineHeight: '1.4' }],     // 18px
        xl: ['1.25rem', { lineHeight: '1.35' }],     // 20px
        '2xl': ['1.5rem', { lineHeight: '1.3' }],    // 24px
        '3xl': ['1.875rem', { lineHeight: '1.25' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '1.2' }],   // 36px
        d1: ['1.15rem', { lineHeight: '1.4' }],
        d2: ['1.4rem', { lineHeight: '1.3' }],
        d3: ['1.75rem', { lineHeight: '1.25' }],
        d4: ['2.25rem', { lineHeight: '1.2' }],
        d5: ['2.75rem', { lineHeight: '1.15' }],
      },
      borderRadius: {
        xs: '3px',
        sm: '4px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
      maxWidth: {
        wrap: '74rem',
        '6xl': '72rem',
      },
    },
  },
  plugins: [],
};
