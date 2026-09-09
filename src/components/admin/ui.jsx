import Link from 'next/link';
import { num } from '@/lib/money';

/* قطع الواجهة المشتركة في الأدمن — كلها بدون حالة، فمافيش 'use client' */

export function PageHead({ title, hint, children }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-d3">{title}</h1>
        {hint ? <p className="mt-1.5 text-xs2 text-ink-60">{hint}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </header>
  );
}

export function Panel({ title, hint, action, children, className = '' }) {
  return (
    <section className={`surface p-5 sm:p-6 ${className}`}>
      {title ? (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="font-display text-d1">{title}</h2>
            {hint ? <p className="mt-1 text-xs2 text-ink-42">{hint}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/**
 * بطاقة رقم.
 * @param {number|null} trend نسبة التغيّر — null معناها مفيش أساس نقارن عليه
 */
export function Kpi({ label, value, sub, trend, tone }) {
  const up = typeof trend === 'number' && trend > 0;
  const down = typeof trend === 'number' && trend < 0;

  const valueColor =
    tone === 'warn' ? 'text-garnet' : tone === 'good' ? 'text-sage' : 'text-oud';

  return (
    <div className="surface p-5">
      <p className="text-xs2 tracking-wide2 text-ink-60">{label}</p>
      <p className={`num mt-2.5 font-display text-d3 ${valueColor}`}>{value}</p>

      <div className="mt-1.5 flex items-baseline gap-2 text-xs2">
        {typeof trend === 'number' ? (
          <span className={up ? 'text-sage' : down ? 'text-garnet' : 'text-ink-42'}>
            <span aria-hidden="true">{up ? '▲' : down ? '▼' : '—'}</span>{' '}
            <span className="num">{num(Math.abs(trend))}%</span>
          </span>
        ) : (
          <span className="text-ink-42">فترة جديدة</span>
        )}
        {sub ? <span className="text-ink-42">{sub}</span> : null}
      </div>
    </div>
  );
}

/** تبويبات المدة — لينكات عادية عشان تفضل تشتغل من غير جافاسكريبت */
export function RangeTabs({ days, base = '/admin', extra = {} }) {
  const opts = [
    { d: 7, label: '٧ أيام' },
    { d: 30, label: '٣٠ يوم' },
    { d: 90, label: '٩٠ يوم' },
  ];

  return (
    <div className="flex border border-hair-soft">
      {opts.map((o) => {
        const params = new URLSearchParams({ ...extra, d: String(o.d) });
        const on = days === o.d;
        return (
          <Link
            key={o.d}
            href={`${base}?${params.toString()}`}
            aria-current={on ? 'true' : undefined}
            className={`px-3.5 py-2 text-xs2 tracking-wide2 transition-colors ${
              on ? 'bg-lacquer text-brass-gilt' : 'text-ink-60 hover:bg-brass/10'
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
    <p className="border border-dashed border-hair-soft px-4 py-8 text-center text-xs1 text-ink-42">
      {children}
    </p>
  );
}

/** رسالة خطأ صريحة — أحسن من صفحة فاضية بتخلّي الواحد يشك في نفسه */
export function Broken({ children }) {
  return (
    <p className="border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet">
      {children || 'مانقدرناش نجيب البيانات دي. اعمل تحديث للصفحة.'}
    </p>
  );
}
