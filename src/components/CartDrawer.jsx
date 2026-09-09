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

  // Escape للإغلاق + قفل تمرير الصفحة + تركيز أول عنصر
  useEffect(() => {
    if (!open) return;

    lastActive.current = document.activeElement;

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);

      // focus trap داخل الدروار (عشان الكيبورد مايفلتش للخلفية)
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

      // ارجع الفوكس للعنصر اللي كان محدد قبل فتح الدروار
      lastActive.current?.focus?.();
    };
  }, [open, setOpen]);

  // صفر (أو أقل) في الحد معناه إن عرض الشحن المجاني مقفول خلاص،
  // فمانعرضش الشريط بالمرة — ومانقسمش على صفر
  const hasOffer = Number(freeShipThreshold) > 0;
  const remaining = hasOffer ? freeShipThreshold - subtotal : 0;
  const progress = hasOffer
    ? Math.min(100, Math.round((subtotal / freeShipThreshold) * 100))
    : 0;

  return (
    <>
      {/* الحاجب */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-lacquer/55 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="عربة التسوق"
        aria-hidden={!open}
        className={`fixed inset-y-0 z-50 flex w-[min(26rem,100vw)] flex-col
                    border-hair bg-glass shadow-2xl transition-transform duration-300
                    ${open ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'}`}
        style={{ insetInlineStart: 'auto', insetInlineEnd: 0, borderInlineStartWidth: 1 }}
      >
        <header className="flex items-center justify-between border-b border-hair px-5 py-4">
          <h2 className="font-display text-d2">العربة</h2>
          <button
            ref={closeBtn}
            type="button"
            onClick={() => setOpen(false)}
            className="btn-ghost px-3 py-1.5"
          >
            إغلاق
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="font-display text-d1 text-ink-60">العربة فاضية</p>
            <p className="text-xs1 text-ink-42">
              كل الأحجام معروضة بأسعارها في الكاتالوج — مش محتاج تسأل.
            </p>
            <Link href="/products" onClick={() => setOpen(false)} className="btn-solid mt-2">
              تفرّج على العطور
            </Link>
          </div>
        ) : (
          <>
            {/* شريط الشحن المجاني — يظهر بس لو فيه عرض */}
            {hasOffer ? (
              <div className="border-b border-hair-soft px-5 py-3.5">
                {remaining > 0 ? (
                  <p className="text-xs2 text-ink-60">
                    باقي <span className="num text-oud">{egp(remaining)}</span> والشحن يبقى مجاني
                  </p>
                ) : (
                  <p className="text-xs2 text-sage">الشحن مجاني على الأوردر ده ✓</p>
                )}
                <span className="mt-2 block h-0.5 w-full bg-hair-soft" aria-hidden="true">
                  <span
                    className="block h-full bg-brass transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </span>
              </div>
            ) : null}

            <ul className="flex-1 divide-y divide-hair-soft overflow-y-auto">
              {items.map((l) => (
                <li key={l.variantId} className="relative flex gap-4 px-5 py-4">
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 w-1"
                    style={{
                      insetInlineStart: 0,
                      background: `linear-gradient(to bottom, ${l.spineTop} 0 33.33%, ${l.spineHeart} 33.33% 66.66%, ${l.spineBase} 66.66%)`,
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs2 tracking-wide2 text-ink-42">{l.brandName}</p>
                    <p className="mt-0.5 font-display text-d1 leading-snug">{l.name}</p>
                    <p className="mt-0.5 text-xs2 text-ink-60">{l.label}</p>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="inline-flex items-stretch border border-hair-soft">
                        <button
                          type="button"
                          onClick={() => setQty(l.variantId, l.qty - 1)}
                          aria-label="أقلّ"
                          className="px-3 text-ink-60 hover:bg-brass/10"
                        >
                          −
                        </button>
                        <span className="num w-9 py-1.5 text-center text-xs1">{l.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(l.variantId, l.qty + 1)}
                          disabled={l.qty >= l.stock}
                          aria-label="أكتر"
                          className="px-3 text-ink-60 hover:bg-brass/10 disabled:opacity-35"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(l.variantId)}
                        className="btn-quiet"
                      >
                        شيل
                      </button>
                    </div>

                    {l.qty >= l.stock ? (
                      <p className="mt-2 text-xs2 text-garnet">
                        ده آخر المتاح من الحجم ده
                      </p>
                    ) : null}
                  </div>

                  <p className="num shrink-0 self-start text-xs1">
                    {egp(l.price * l.qty)}
                  </p>
                </li>
              ))}
            </ul>

            <footer className="border-t border-hair px-5 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs1 text-ink-60">
                  المجموع ({count} قطعة)
                </span>
                <span className="num font-display text-d2">{egp(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs2 text-ink-42">
                الشحن بيتحدّد بعد اختيار المحافظة.
              </p>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="btn-solid mt-4 w-full"
              >
                إتمام الأوردر
              </Link>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
