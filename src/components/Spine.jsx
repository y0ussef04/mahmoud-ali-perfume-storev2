import { SCALE_5 } from '@/lib/labels';

/**
 * عمود الرائحة — التوقيع البصري للموقع.
 * ٣ شرايح لون رأسية على حرف الكارت: المقدمة / القلب / القاعدة.
 * الألوان جاية من الداتابيز ومتولّدة من النوتات الفعلية للعطر،
 * فالعميل يقدر يفرز بصرياً بين عطر حمضي وعطر عودي من غير قراية.
 */
export default function Spine({ product, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`spine ${className}`}
      style={{
        '--nt': product.spine_top || '#C9A45C',
        '--nh': product.spine_heart || '#8E3E44',
        '--nb': product.spine_base || '#3A2318',
      }}
    />
  );
}

/** مفتاح قراءة العمود — بيتحطّ مرة واحدة في أول الكاتالوج */
export function SpineKey({ className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-xs2 text-ink-60 ${className}`}>
      <span className="tracking-wide2">قراءة الشريط اللوني:</span>
      {[
        ['المقدمة', '#C9A45C'],
        ['القلب', '#8E3E44'],
        ['القاعدة', '#3A2318'],
      ].map(([label, c]) => (
        <span key={label} className="inline-flex items-center gap-2">
          <span
            className="inline-block h-3 w-3"
            style={{ background: c }}
            aria-hidden="true"
          />
          {label}
        </span>
      ))}
    </div>
  );
}

/** شرح النوتات نصّياً — في صفحة العطر */
export function NoteLadder({ product }) {
  const rows = [
    ['المقدمة', product.notes_top, product.spine_top, 'أول ما ترشّه'],
    ['القلب', product.notes_heart, product.spine_heart, 'بعد ١٥–٣٠ دقيقة'],
    ['القاعدة', product.notes_base, product.spine_base, 'اللي بيفضل على الهدوم'],
  ].filter(([, notes]) => Array.isArray(notes) && notes.length > 0);

  if (!rows.length) return null;

  return (
    <dl className="divide-y divide-hair-soft">
      {rows.map(([stage, notes, color, when]) => (
        <div key={stage} className="flex gap-4 py-3.5">
          <span
            className="mt-1 h-10 w-1 shrink-0"
            style={{ background: color }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <dt className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-display text-d1">{stage}</span>
              <span className="text-xs2 text-ink-42">{when}</span>
            </dt>
            <dd className="mt-1 text-xs1 text-ink-60">{notes.join(' · ')}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

/** مقياس الثبات والفوحان — نقط مش نجوم */
export function Strength({ value, label }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-xs2 tracking-wide2 text-ink-60">{label}</span>
      <span className="flex gap-1" role="img" aria-label={`${label}: ${SCALE_5[value]}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-4 ${i <= value ? 'bg-brass' : 'bg-hair-soft'}`}
          />
        ))}
      </span>
      <span className="text-xs2 text-ink-42">{SCALE_5[value]}</span>
    </div>
  );
}
