'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart';
import { egp } from '@/lib/money';

export default function AddToCart({ product: p }) {
  const { add } = useCart();
  const [variantId, setVariantId] = useState(p.defaultVariantId);
  const [qty, setQty] = useState(1);
  const [addingState, setAddingState] = useState(false);

  const v = p.variants.find((x) => x.id === variantId) || null;
  const out = !v || v.stock <= 0;

  const submit = () => {
    if (!v || out) return;

    setAddingState('loading');
    setTimeout(() => {
      add(
        {
          variantId: v.id,
          productId: p.id,
          slug: p.slug,
          name: p.name_ar,
          brandName: p.brand?.name_ar || '',
          label: v.label,
          price: Number(v.price),
          stock: v.stock,
          spineTop: p.spine_top,
          spineHeart: p.spine_heart,
          spineBase: p.spine_base,
        },
        qty
      );

      setAddingState('success');
      setTimeout(() => {
        setAddingState(false);
        setQty(1);
      }, 600);
    }, 150);
  };

  return (
    <div className="space-y-4">
      {/* ─── الأحجام ─────────────────────────────────────── */}
      <fieldset>
        <legend className="text-xs font-semibold text-[#6B6760] dark:text-[#A09C94] mb-2">اختر الحجم المناسب</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {p.variants.map((x) => {
            const gone = x.stock <= 0;
            const on = x.id === variantId;
            const off = x.compare_price && Number(x.compare_price) > Number(x.price);

            return (
              <label
                key={x.id}
                className={`flex cursor-pointer items-center justify-between gap-3 border px-4 py-3 rounded-lg min-h-[44px]
                            transition-colors duration-150 ${
                              gone
                                ? 'cursor-not-allowed border-[#E8E6E1] opacity-40 bg-[#FAFAF8]'
                                : on
                                  ? 'border-[#1A1814] bg-[#1A1814] text-white dark:bg-white dark:text-[#1A1814]'
                                  : 'border-[#E8E6E1] dark:border-[#2E2B22] hover:border-[#C9A84C]'
                            }`}
              >
                <span className="flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="radio"
                    name="variant"
                    value={x.id}
                    checked={on}
                    disabled={gone}
                    onChange={() => {
                      setVariantId(x.id);
                      setQty(1);
                    }}
                    className="accent-[#C9A84C]"
                  />
                  <span>{x.label}</span>
                </span>

                <span className="num text-xs font-semibold">
                  {gone ? (
                    <span className="text-xs font-normal">غير متاح</span>
                  ) : (
                    <>
                      {egp(x.price)}
                      {off ? (
                        <span
                          className={`ms-2 text-xs line-through font-normal ${
                            on ? 'opacity-70' : 'text-[#6B6760]'
                          }`}
                        >
                          {egp(x.compare_price)}
                        </span>
                      ) : null}
                    </>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* ─── الكمية والإضافة ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <div className="inline-flex items-center border border-[#E8E6E1] dark:border-[#2E2B22] rounded-lg">
          <button
            type="button"
            onClick={() => setQty((n) => Math.max(1, n - 1))}
            disabled={qty <= 1}
            aria-label="تقليل الكمية"
            className="px-3 py-2.5 text-sm font-semibold text-[#1A1814] dark:text-white hover:bg-[#FAFAF8] disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            −
          </button>
          <span className="num w-10 text-center text-sm font-semibold">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((n) => Math.min(v?.stock ?? 1, n + 1))}
            disabled={!v || qty >= v.stock}
            aria-label="زيادة الكمية"
            className="px-3 py-2.5 text-sm font-semibold text-[#1A1814] dark:text-white hover:bg-[#FAFAF8] disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={out || addingState === 'loading'}
          className="flex-1 bg-[#1A1814] hover:bg-[#2D2921] text-white text-sm font-semibold py-3 rounded-lg transition-all duration-150 active:scale-[0.97] min-h-[44px] flex items-center justify-center gap-2"
        >
          {addingState === 'loading' ? (
            <span>جاري الإضافة...</span>
          ) : addingState === 'success' ? (
            <span className="text-[#C9A84C] font-semibold">أضيف للعربة ✓</span>
          ) : out ? (
            'هذا الحجم غير متاح'
          ) : (
            `إضافة للعربة — ${egp((Number(v?.price) || 0) * qty)}`
          )}
        </button>
      </div>

      {v && v.stock > 0 && v.stock <= 3 ? (
        <p className="num text-xs text-[#9B1C1C] font-semibold">
          متبقي {v.stock} قطع فقط في المخزون.
        </p>
      ) : null}
    </div>
  );
}
