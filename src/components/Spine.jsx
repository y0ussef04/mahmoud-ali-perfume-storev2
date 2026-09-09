import { SCALE_5 } from '@/lib/labels';

/**
 * الشريط اللوني للنوتات العطرية — ٣ أجزاء ملونة (مقدمة / قلب / قاعدة)
 */
export function ScentNotesBar({ product, className = '' }) {
  const topColor = product?.spine_top || '#C9A84C';   // amber/gold
  const heartColor = product?.spine_heart || '#B85B6C'; // rose/pink
  const baseColor = product?.spine_base || '#1A1814';   // near-black

  return (
    <div className={`w-full space-y-1 ${className}`}>
      <div className="h-1.5 rounded-full flex gap-0.5 overflow-hidden w-full bg-[#E8E6E1]">
        <div className="h-full flex-1 rounded-s-full transition-colors duration-150" style={{ backgroundColor: topColor }} title="المقدمة" />
        <div className="h-full flex-1 transition-colors duration-150" style={{ backgroundColor: heartColor }} title="القلب" />
        <div className="h-full flex-1 rounded-e-full transition-colors duration-150" style={{ backgroundColor: baseColor }} title="القاعدة" />
      </div>
      <div className="flex justify-between items-center text-xs text-[#6B6760]">
        <span>مقدمة</span>
        <span>قلب</span>
        <span>قاعدة</span>
      </div>
    </div>
  );
}

export default function Spine({ product, className = '' }) {
  return <ScentNotesBar product={product} className={className} />;
}

export function SpineKey({ className = '' }) {
  return (
    <div className={`flex items-center gap-4 text-xs text-[#6B6760] ${className}`}>
      <span className="font-semibold text-[#1A1814]">الشريط اللوني للنوتات:</span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#C9A84C]" />
        مقدمة
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#B85B6C]" />
        قلب
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#1A1814]" />
        قاعدة
      </span>
    </div>
  );
}

export function NoteLadder({ product }) {
  const rows = [
    ['المقدمة', product?.notes_top, product?.spine_top || '#C9A84C', 'أول ١٥ دقيقة'],
    ['القلب', product?.notes_heart, product?.spine_heart || '#B85B6C', 'الثبات الأساسي'],
    ['القاعدة', product?.notes_base, product?.spine_base || '#1A1814', 'الاستقرار الطويل'],
  ].filter(([, notes]) => Array.isArray(notes) && notes.length > 0);

  if (!rows.length) return null;

  return (
    <dl className="divide-y divide-[#E8E6E1] dark:divide-[#2E2B22]">
      {rows.map(([stage, notes, color, when]) => (
        <div key={stage} className="flex gap-4 py-3.5">
          <span
            className="mt-1 h-10 w-1 rounded-full shrink-0"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <dt className="flex items-baseline gap-x-3">
              <span className="font-semibold text-sm text-[#1A1814] dark:text-white">{stage}</span>
              <span className="text-xs text-[#6B6760]">{when}</span>
            </dt>
            <dd className="mt-1 text-xs text-[#1A1814] dark:text-white/80">{notes.join(' · ')}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

export function Strength({ value, label }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-16 font-medium text-[#6B6760]">{label}</span>
      <span className="flex gap-1" role="img" aria-label={`${label}: ${SCALE_5[value]}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-4 rounded-full ${i <= value ? 'bg-[#C9A84C]' : 'bg-[#E8E6E1]'}`}
          />
        ))}
      </span>
      <span className="text-[#6B6760]">{SCALE_5[value]}</span>
    </div>
  );
}
