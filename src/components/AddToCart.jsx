'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart';
import { egp } from '@/lib/money';
import { ShoppingBag } from 'lucide-react';

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
          className="group/btn relative overflow-hidden flex-1 bg-gradient-to-r from-[#1A1814] to-[#2D2921] dark:from-[#C9A84C] dark:to-[#8B6914] text-white text-sm font-semibold py-3 rounded-full transition-all duration-300 active:scale-[0.97] min-h-[44px] flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-[#C9A84C]/20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
          
          <div className="relative flex items-center justify-center gap-2">
            {addingState === 'loading' ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>جاري الإضافة...</span>
              </span>
            ) : addingState === 'success' ? (
              <span className="inline-flex items-center gap-1.5 text-white font-semibold">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
                <span>أضيف للعربة</span>
              </span>
            ) : out ? (
              <span>هذا الحجم غير متاح</span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 transition-transform duration-300 group-hover/btn:scale-110" strokeWidth={1.5} />
                <span>إضافة للعربة — {egp((Number(v?.price) || 0) * qty)}</span>
              </span>
            )}
          </div>
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
