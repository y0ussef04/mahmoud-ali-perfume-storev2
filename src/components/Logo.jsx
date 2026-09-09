'use client';

/**
 * شعار البراند — نسخة SVG مبنية بالإيد.
 *
 * ⚠️ لما توصلك صورة الشعار الأصلية: حُطّها في public/logo.png
 * وشيل التعليق من <Image> في الأسفل واستخدمها بدل الـ SVG.
 *
 * 'use client' هنا عشان useId — الصفحة الواحدة فيها أكتر من Mark
 * (الهيدر + الفوتر مثلاً)، ولو الـ id الخاص بالتدرّج ثابت بيتكرّر
 * وبيبقى HTML غير صالح. useId بيدّي كل نسخة id فريد يطابق بين
 * السيرفر والمتصفح.
 */

import { useId } from 'react';

export function Mark({ size = 44, className = '' }) {
  // useId بيرجّع نص فيه نقطتين رأسيتين — بنشيلها عشان url(#..) في الـ SVG
  const GOLD = `g${useId().replace(/:/g, '')}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Mahmoud-Ali's store"
      className={className}
    >
      <defs>
        <linearGradient id={GOLD} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E4C48C" />
          <stop offset="48%" stopColor="#A9834E" />
          <stop offset="100%" stopColor="#E4C48C" />
        </linearGradient>
      </defs>

      {/* القرص */}
      <circle cx="50" cy="50" r="49" fill="#000" />
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke={`url(#${GOLD})`}
        strokeWidth="0.9"
        opacity="0.75"
      />

      {/* البخاخة — الرأس والزرّ */}
      <rect x="45.5" y="17" width="9" height="6" rx="1" fill={`url(#${GOLD})`} />
      <rect x="48" y="23" width="4" height="5" fill={`url(#${GOLD})`} opacity="0.9" />

      {/* رشّة الضباب */}
      <g fill={`url(#${GOLD})`}>
        <circle cx="63" cy="20" r="1.5" opacity="0.85" />
        <circle cx="69" cy="16" r="1.1" opacity="0.6" />
        <circle cx="67" cy="24" r="0.9" opacity="0.5" />
        <circle cx="74" cy="21" r="0.7" opacity="0.35" />
      </g>

      {/* المونوجرام */}
      <text
        x="50"
        y="66"
        textAnchor="middle"
        fill={`url(#${GOLD})`}
        style={{
          fontFamily: 'var(--f-mark), Georgia, serif',
          fontSize: '34px',
          letterSpacing: '0.02em',
        }}
      >
        MA
      </text>

      {/* الخطوط المعدنية */}
      <line x1="26" y1="74" x2="74" y2="74" stroke={`url(#${GOLD})`} strokeWidth="0.7" />
      <line
        x1="34"
        y1="77"
        x2="66"
        y2="77"
        stroke={`url(#${GOLD})`}
        strokeWidth="0.5"
        opacity="0.6"
      />

      {/* المعيّن */}
      <rect
        x="48.2"
        y="82"
        width="3.6"
        height="3.6"
        fill={`url(#${GOLD})`}
        transform="rotate(45 50 83.8)"
      />
    </svg>
  );
}

/**
 * القفل الكامل: علامة + اسم.
 * @param {'onDark'|'onLight'} tone
 */
export default function Logo({ size = 40, tone = 'onDark', className = '' }) {
  const wordColor = tone === 'onDark' ? 'text-brass-gilt' : 'text-oud';
  const subColor = tone === 'onDark' ? 'text-brass' : 'text-ink-60';

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Mark size={size} />
      <span className="flex flex-col leading-none">
        <span
          className={`font-mark text-xs1 tracking-wide3 ${wordColor}`}
          style={{ fontWeight: 600 }}
        >
          MAHMOUD&nbsp;ALI
        </span>
        <span className={`mt-1 font-display text-xs2 tracking-wide2 ${subColor}`}>
          Store
        </span>
      </span>
    </span>
  );
}
