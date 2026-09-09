'use client';

import { useCart } from '@/lib/cart';
import { egp } from '@/lib/money';

export default function MobileQuickBar({ waNumber = '' }) {
  const { count, subtotal, setOpen } = useCart();

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 border-t border-brass/35 bg-lacquer/95 backdrop-blur px-4 py-3 md:hidden shadow-2xl">
      <div className="mx-auto flex items-center justify-between gap-3 max-w-wrap">
        {/* معلومات العربة والسعر */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2.5 text-right flex-1"
        >
          <div className="relative border border-brass-gilt/60 bg-brass-gilt/15 p-2 rounded-xs">
            <span className="text-lg leading-none">🛍️</span>
            {count > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-brass-gilt text-lacquer text-xs2 font-bold num">
                {count}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs2 text-brass/70 leading-tight">العربة ({count})</p>
            <p className="text-xs1 font-bold text-brass-gilt num leading-snug">
              {subtotal > 0 ? egp(subtotal) : 'تصفح الكاتالوج'}
            </p>
          </div>
        </button>

        {/* زر فتح العربة المباشر */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-solid border-brass-gilt bg-brass-gilt text-lacquer text-xs1 px-4 py-2.5 font-medium shrink-0"
        >
          {count > 0 ? 'إتمام الأوردر ➔' : 'فتح العربة'}
        </button>

        {/* زر واتساب السريع لو توفر الرقم */}
        {waNumber && (
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent('أهلاً محمود، محتاج استفسار عن العطور')}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="تواصل واتساب"
            className="border border-emerald-500/50 bg-emerald-950/40 text-emerald-400 p-2.5 rounded-xs shrink-0 hover:bg-emerald-900/60"
          >
            💬
          </a>
        )}
      </div>
    </div>
  );
}
