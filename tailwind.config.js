/** @type {import('tailwindcss').Config} */
module.exports = {
  // الثيم بيتبدّل بإضافة كلاس .dark على <html> — بنقلب متغيّرات CSS مش نعيد كتابة الكلاسات
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ألوان الهوية بترجع لمتغيّرات CSS متعرّفة في globals.css.
        // الصيغة القنواتية "R G B" بتخلّي مُعدِّلات الشفافية (‎/50) تشتغل:
        //   bg-brass       → rgb(var(--c-brass) / 1)
        //   bg-brass/8     → rgb(var(--c-brass) / .08)
        // .dark بيقلب قيمة المتغيّر، فكل الأبب بيتحوّل لوحده من غير تعديل كلاسات.

        // ثوابت الهوية — مابتتقلبش بين اللايت والدارك
        lacquer: 'rgb(var(--c-lacquer) / <alpha-value>)', // أسود الكروم
        brass: {
          DEFAULT: 'rgb(var(--c-brass) / <alpha-value>)',
          light: 'rgb(var(--c-brass-light) / <alpha-value>)',
          gilt: 'rgb(var(--c-brass-gilt) / <alpha-value>)',
        },
        frost: 'rgb(var(--c-frost) / <alpha-value>)', // نص فاتح فوق الكروم الأسود
        espresso: 'rgb(var(--c-espresso) / <alpha-value>)', // حبر داكن ثابت للكروم

        // أسطح ونصوص بتتقلب في الدارك
        page: 'rgb(var(--c-page) / <alpha-value>)', // خلفية الصفحة
        glass: 'rgb(var(--c-glass) / <alpha-value>)', // الكروت والأسطح
        elevated: 'rgb(var(--c-elevated) / <alpha-value>)', // الحقول والمنبثقات
        oud: 'rgb(var(--c-oud) / <alpha-value>)', // النص الأساسي
        garnet: 'rgb(var(--c-garnet) / <alpha-value>)', // خطأ/خطر
        sage: 'rgb(var(--c-sage) / <alpha-value>)', // نجاح

        // حشو مصمت للشارات — ثابت في الثيمين (نص أبيض دايماً فوقه)
        'success-solid': 'rgb(var(--c-success-solid) / <alpha-value>)',
        'danger-solid': 'rgb(var(--c-danger-solid) / <alpha-value>)',

        // ألوان بشفافية ثابتة — القيمة rgba كاملة (مابتتستخدمش مع مُعدِّل شفافية)
        'ink-60': 'var(--c-ink-60)',
        'ink-42': 'var(--c-ink-42)',
        hair: 'var(--c-hair)',
        'hair-soft': 'var(--c-hair-soft)',
      },
      fontFamily: {
        display: ['var(--f-display)', 'Amiri', 'Georgia', 'serif'],
        body: ['var(--f-body)', 'Segoe UI', 'system-ui', 'sans-serif'],
        mark: ['var(--f-mark)', 'Georgia', 'serif'],
      },
      fontSize: {
        // سلّم مقياسه 1.26
        xs2: ['0.75rem', { lineHeight: '1.5' }],
        xs1: ['0.85rem', { lineHeight: '1.55' }],
        base: ['1rem', { lineHeight: '1.7' }],
        d1: ['1.26rem', { lineHeight: '1.45' }],
        d2: ['1.59rem', { lineHeight: '1.35' }],
        d3: ['2rem', { lineHeight: '1.25' }],
        d4: ['2.52rem', { lineHeight: '1.15' }],
        d5: ['3.18rem', { lineHeight: '1.08' }],
      },
      borderRadius: { sharp: '2px' },
      maxWidth: { wrap: '74rem' },
      letterSpacing: { wide2: '0.14em', wide3: '0.24em' },
      keyframes: {
        bloom: {
          '0%': { opacity: '0', transform: 'translate3d(0,14px,0) scale(.94)' },
          '100%': { opacity: '1', transform: 'translate3d(0,0,0) scale(1)' },
        },
        mist: {
          '0%': { opacity: '0', transform: 'scale(.7) translateY(10px)' },
          '55%': { opacity: '.55' },
          '100%': { opacity: '0', transform: 'scale(1.35) translateY(-26px)' },
        },
      },
      animation: {
        bloom: 'bloom .9s cubic-bezier(.2,.7,.2,1) both',
        mist: 'mist 3.4s ease-out both',
      },
    },
  },
  plugins: [],
};
