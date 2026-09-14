'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

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
          <Sun strokeWidth={1.5} className="w-4 h-4" />
        ) : (
          // قمر — الضغط بيحوّل للداكن
          <Moon strokeWidth={1.5} className="w-4 h-4" />
        )}
      </span>
    </button>
  );
}
