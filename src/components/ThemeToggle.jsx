'use client';

import { useEffect, useState } from 'react';

/**
 * زرار تبديل الثيم (فاتح/داكن).
 *
 * السكربت اللي في الـ layout بيحطّ كلاس .dark على <html> قبل أي رسم،
 * فالزرار هنا بس بيقلب الكلاس ويحفظ الاختيار في localStorage. مافيش
 * context عشان المتجر أغلبه server components والكلاس على <html> كفاية.
 *
 * الزرار بيعيش جوّه الكروم الأسود (الهيدر/الأدمن) اللي لونه ثابت في
 * الثيمين، فستايله برونزي على أسود دايماً.
 */
export default function ThemeToggle({ className = '' }) {
  const [isDark, setIsDark] = useState(false);

  // نقرا الحالة الحقيقية من <html> بعد ما الكومبوننت يتركّب على العميل
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const el = document.documentElement;
    const next = !el.classList.contains('dark');
    el.classList.toggle('dark', next);
    el.style.colorScheme = next ? 'dark' : 'light';
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch (_) {
      /* الخصوصية ممكن تمنع التخزين — الزرار يفضل شغّال في الجلسة */
    }
    setIsDark(next);
  }

  const label = isDark ? 'الوضع الفاتح' : 'الوضع الداكن';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={
        className ||
        `grid h-9 w-9 place-items-center border border-brass/45 text-brass-gilt
         transition-colors hover:bg-brass/15 active:scale-95`
      }
      style={{ borderRadius: 2 }}
    >
      <span suppressHydrationWarning className="block transition-transform duration-300">
        {isDark ? (
          // شمس — الضغط بيرجّع للفاتح
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2v2.4M12 19.6V22M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2 12h2.4M19.6 12H22M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
          </svg>
        ) : (
          // قمر — الضغط بيحوّل للداكن
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </span>
    </button>
  );
}
