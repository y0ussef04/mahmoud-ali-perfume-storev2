/*
 * DESIGN DECISIONS:
 * Layout: Cart drawer slides smoothly from end side (RTL right) with backdrop blur overlay.
 * Mobile: Width 90vw max-w-sm, touch-optimized 44px min-h buttons.
 * Removed: Emoji icons, non-standard styling.
 * RTL notes: Positioned on end-0 (right), price format X ج.م.
 */

'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useCart } from '@/lib/cart';
import { egp } from '@/lib/money';

export default function CartDrawer({ freeShipThreshold = 1500 }) {
  const { items, subtotal, count, setQty, remove, open, setOpen } = useCart();
  const panel = useRef(null);
  const closeBtn = useRef(null);
  const lastActive = useRef(null);

  useEffect(() => {
    if (!open) return;

    lastActive.current = document.activeElement;

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);

      if (e.key === 'Tab') {
        const root = panel.current;
        if (!root) return;

        const focusables = Array.from(
          root.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => {
          const disabled = 'disabled' in el && el.disabled;
          const hidden = el.getAttribute('aria-hidden') === 'true';
          return !disabled && !hidden;
        });

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      lastActive.current?.focus?.();
    };
  }, [open, setOpen]);

  const hasOffer = Number(freeShipThreshold) > 0;
  const remaining = hasOffer ? freeShipThreshold - subtotal : 0;
  const progress = hasOffer
    ? Math.min(100, Math.round((subtotal / freeShipThreshold) * 100))
    : 0;

  return (
    <>
      {/* Overlay: bg-black/40 backdrop-blur-sm */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Drawer Panel: Slide from Right side (RTL Start) */}
      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="عربة التسوق"
        aria-hidden={!open}
        className={`fixed top-0 bottom-0 right-0 z-50 flex w-[90vw] max-w-sm flex-col bg-white dark:bg-[#1C1A14] border-s border-[#E8E6E1] dark:border-[#2E2B22] shadow-2xl transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        <header className="flex items-center justify-between border-b border-[#E8E6E1] dark:border-[#2E2B22] px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[#1A1814] dark:text-white">عربة التسوق</h2>
            <span className="w-5 h-5 bg-[#C9A84C] text-white text-[10px] font-semibold rounded-full flex items-center justify-center num">
              {count}
            </span>
          </div>
          <button
            ref={closeBtn}
            type="button"
            onClick={() => setOpen(false)}
            className="p-2 text-[#6B6760] hover:text-[#1A1814] dark:hover:text-white rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="إغلاق العربة"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FAFAF8] dark:bg-[#111009] border border-[#E8E6E1] dark:border-[#2E2B22] flex items-center justify-center text-[#6B6760]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-[#1A1814] dark:text-white">العربة فارغة حالياً</p>
            <p className="text-xs text-[#6B6760] dark:text-[#A09C94]">
              تصفح الكاتالوج واشترِ عطورك المفضلة بأسعارها المباشرة.
            </p>
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className="bg-[#1A1814] hover:bg-[#2D2921] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors duration-150 active:scale-[0.97] min-h-[44px] flex items-center justify-center"
            >
              عرض الكاتالوج
            </Link>
          </div>
        ) : (
          <>
            {hasOffer ? (
              <div className="border-b border-[#E8E6E1] dark:border-[#2E2B22] px-5 py-3 bg-[#FAFAF8] dark:bg-[#111009]">
                {remaining > 0 ? (
                  <p className="text-xs font-medium text-[#6B6760]">
                    باقي <span className="text-[#1A1814] dark:text-white font-semibold num">{egp(remaining)}</span> للحصول على شحن مجاني
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-[#2D6A4F]">الشحن مجاني على هذا الأوردر</p>
                )}
                <div className="mt-2 h-1.5 w-full bg-[#E8E6E1] dark:bg-[#2E2B22] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#C9A84C] transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : null}

            <ul className="flex-1 divide-y divide-[#E8E6E1] dark:divide-[#2E2B22] overflow-y-auto px-5">
              {items.map((l) => (
                <li key={l.variantId} className="py-4 flex gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs text-[#6B6760]">{l.brandName}</p>
                    <h4 className="text-sm font-semibold text-[#1A1814] dark:text-white line-clamp-1">{l.name}</h4>
                    <p className="text-xs text-[#6B6760]">{l.label}</p>

                    <div className="flex items-center gap-3 pt-2">
                      <div className="inline-flex items-center border border-[#E8E6E1] dark:border-[#2E2B22] rounded-lg">
                        <button
                          type="button"
                          onClick={() => setQty(l.variantId, l.qty - 1)}
                          className="px-2.5 py-1 text-sm font-semibold text-[#1A1814] dark:text-white hover:bg-[#FAFAF8] min-h-[36px] min-w-[36px] flex items-center justify-center"
                          aria-label="تقليل الكمية"
                        >
                          −
                        </button>
                        <span className="num px-3 text-xs font-semibold">{l.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(l.variantId, l.qty + 1)}
                          disabled={l.qty >= l.stock}
                          className="px-2.5 py-1 text-sm font-semibold text-[#1A1814] dark:text-white hover:bg-[#FAFAF8] disabled:opacity-40 min-h-[36px] min-w-[36px] flex items-center justify-center"
                          aria-label="زيادة الكمية"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(l.variantId)}
                        className="text-xs font-semibold text-[#9B1C1C] hover:underline"
                      >
                        حذف
                      </button>
                    </div>
                  </div>

                  <span className="num font-semibold text-sm text-[#1A1814] dark:text-white">
                    {egp(l.price * l.qty)}
                  </span>
                </li>
              ))}
            </ul>

            <footer className="border-t border-[#E8E6E1] dark:border-[#2E2B22] p-5 space-y-3 bg-[#FAFAF8] dark:bg-[#111009]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6B6760]">المجموع الإجمالي</span>
                <span className="num font-semibold text-base text-[#1A1814] dark:text-white">{egp(subtotal)}</span>
              </div>

              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="w-full bg-[#1A1814] hover:bg-[#2D2921] text-white text-sm font-semibold py-3 rounded-lg transition-colors duration-150 active:scale-[0.97] min-h-[44px] flex items-center justify-center"
              >
                متابعة وإتمام الطلب
              </Link>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
