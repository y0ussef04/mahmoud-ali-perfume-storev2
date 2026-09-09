/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        page: '#FAFAF8',
        surface: '#FFFFFF',
        'border-warm': '#E8E6E1',
        'text-primary': '#1A1814',
        'text-muted': '#6B6760',
        gold: {
          DEFAULT: '#C9A84C',
          dark: '#8B6914',
        },
        'success-green': '#2D6A4F',
        'danger-red': '#9B1C1C',
        dark: {
          bg: '#111009',
          surface: '#1C1A14',
          border: '#2E2B22',
        },
      },
      fontFamily: {
        sans: ['var(--f-sans)', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.4' }],      // 12px
        sm: ['0.875rem', { lineHeight: '1.5' }],     // 14px
        base: ['1rem', { lineHeight: '1.7' }],       // 16px
        lg: ['1.125rem', { lineHeight: '1.4' }],     // 18px
        xl: ['1.25rem', { lineHeight: '1.35' }],     // 20px
        '2xl': ['1.5rem', { lineHeight: '1.3' }],    // 24px
        '3xl': ['1.875rem', { lineHeight: '1.25' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '1.2' }],   // 36px
      },
      fontWeight: {
        normal: '400',
        semibold: '600',
        medium: '600', // Constraint to 400 and 600 only
        bold: '600',
      },
      borderRadius: {
        xl: '0.75rem',  // 12px
        '2xl': '1rem',  // 16px
      },
      maxWidth: {
        '6xl': '72rem', // 1152px max width
      },
    },
  },
  plugins: [],
};
