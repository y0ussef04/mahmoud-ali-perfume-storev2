import Link from 'next/link';
import { num } from '@/lib/money';
import { TrendingUp, TrendingDown, Minus, Inbox, AlertCircle } from 'lucide-react';

/* قطع الواجهة المشتركة في الأدمن — أسلوب عصري فاخر متناسق مع صفحات المتجر */

export function PageHead({ title, hint, children }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1814] dark:text-[#F5F2EB]">
          {title}
        </h1>
        {hint ? (
          <p className="mt-1.5 text-xs text-[#736B5E] dark:text-[#A8A296] leading-relaxed">
            {hint}
          </p>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2.5">{children}</div> : null}
    </header>
  );
}

export function Panel({ title, hint, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#1A1814]/90 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none backdrop-blur-sm transition-all duration-300 ${className}`}>
      {title ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EFEA] dark:border-[#26231C] pb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#1A1814] dark:text-[#F5F2EB]">
              {title}
            </h2>
            {hint ? (
              <p className="mt-1 text-xs text-[#736B5E] dark:text-[#A8A296]">{hint}</p>
            ) : null}
          </div>
          {action ? <div className="flex items-center gap-2">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/**
 * بطاقة إحصائية فاخرة (KPI Card)
 * @param {number|null} trend نسبة التغيّر
 */
export function Kpi({ label, value, sub, trend, tone }) {
  const up = typeof trend === 'number' && trend > 0;
  const down = typeof trend === 'number' && trend < 0;

  const valueColor =
    tone === 'warn'
      ? 'text-[#9B1C1C] dark:text-[#E06A6A]'
      : tone === 'good'
      ? 'text-[#2E6B4D] dark:text-[#68BA8B]'
      : 'text-[#1A1814] dark:text-[#F5F2EB]';

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#1A1814]/90 p-5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:shadow-none transition-all duration-300 hover:border-[#C9A84C]/50 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#736B5E] dark:text-[#A8A296]">{label}</p>
        {typeof trend === 'number' ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              up
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : down
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'bg-stone-500/10 text-stone-500'
            }`}
          >
            {up ? (
              <TrendingUp className="w-3 h-3" />
            ) : down ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            <span className="num">{num(Math.abs(trend))}%</span>
          </span>
        ) : null}
      </div>

      <p className={`num mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight ${valueColor}`}>
        {value}
      </p>

      {sub ? (
        <p className="mt-2 text-[11px] text-[#A8A296] dark:text-[#736B5E]">{sub}</p>
      ) : null}
    </div>
  );
}

/** تبويبات الفترات بتصميم كبسولي (Pill-shaped tabs) */
export function RangeTabs({ days, base = '/admin', extra = {} }) {
  const opts = [
    { d: 7, label: '٧ أيام' },
    { d: 30, label: '٣٠ يوم' },
    { d: 90, label: '٩٠ يوم' },
  ];

  return (
    <div className="inline-flex rounded-full border border-[#E8E6E1] dark:border-[#2E2B22] bg-[#F7F6F2] dark:bg-[#151412] p-1 shadow-inner">
      {opts.map((o) => {
        const params = new URLSearchParams({ ...extra, d: String(o.d) });
        const on = days === o.d;
        return (
          <Link
            key={o.d}
            href={`${base}?${params.toString()}`}
            aria-current={on ? 'true' : undefined}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
              on
                ? 'bg-gradient-to-r from-[#1A1814] to-[#2D2921] dark:from-[#C9A84C] dark:to-[#8B6914] text-white shadow-sm'
                : 'text-[#736B5E] dark:text-[#A8A296] hover:text-[#1A1814] dark:hover:text-white'
            }`}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}

export function Empty({ children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8E6E1] dark:border-[#2E2B22] bg-[#FAF9F5]/50 dark:bg-[#171512]/50 px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#E8E6E1]/50 dark:bg-[#2E2B22]/50 text-[#736B5E] dark:text-[#A8A296]">
        <Inbox className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <p className="max-w-md text-xs sm:text-sm text-[#736B5E] dark:text-[#A8A296] leading-relaxed">
        {children}
      </p>
    </div>
  );
}

/** رسالة خطأ أنيقة ومنحنية */
export function Broken({ children }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3.5 text-xs sm:text-sm text-rose-700 dark:text-rose-400">
      <AlertCircle className="h-5 w-5 shrink-0" />
      <p>{children || 'تعذر تحميل هذه البيانات في الوقت الحالي. برجاء تحديث الصفحة.'}</p>
    </div>
  );
}
