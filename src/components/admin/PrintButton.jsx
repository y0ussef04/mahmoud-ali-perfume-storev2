'use client';

/**
 * زرار الطباعة — سطر واحد بس محتاج 'use client' عشان window.print.
 * فصلته في ملف لوحده عشان صفحة الفاتورة تفضل سيرفر كاملة.
 */
export default function PrintButton({ label = 'اطبع' }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-solid">
      {label}
    </button>
  );
}
