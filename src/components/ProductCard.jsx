/*
 * DESIGN DECISIONS:
 * Layout: Card redesigned with 3/4 aspect image, upfront variant pricing, scent notes bar, and touch-optimized action button.
 * Mobile: 2-column grid ready with 44px min-h touch target on buttons.
 * Removed: Emoji icons, heavy shadows, decorative card backgrounds.
 * RTL notes: All spacing uses start/end logical properties, price formatted as "X ج.م".
 */

'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import ProductPhoto from '@/components/ProductPhoto';
import { ScentNotesBar } from '@/components/Spine';
import { useCart } from '@/lib/cart';
import { egp } from '@/lib/money';
import { COUNTRY, FAMILY, GENDER } from '@/lib/labels';

export default function ProductCard({ product: p }) {
  const { add } = useCart();
  const [addingState, setAddingState] = useState(null); // { id, state: 'loading' | 'success' }
  const timerRef = useRef(null);

  const selectedVariant = p.variants?.[0] || null;

  const handleAdd = (v, e) => {
    if (e) e.preventDefault();
    if (!v || v.stock <= 0) return;

    // Step 1: Loading state (150ms simulated response)
    setAddingState({ id: v.id, state: 'loading' });

    setTimeout(() => {
      add({
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
      });

      // Step 2: Success state for 600ms
      setAddingState({ id: v.id, state: 'success' });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setAddingState(null);
      }, 600);
    }, 150);
  };

  // الخصم للأحجام
  const discountPct = p.variants?.reduce((max, v) => {
    if (v.compare_price && Number(v.compare_price) > Number(v.price)) {
      const pct = Math.round((1 - Number(v.price) / Number(v.compare_price)) * 100);
      return Math.max(max, pct);
    }
    return max;
  }, 0) || 0;

  const allOut = p.variants?.length > 0 && p.variants.every((v) => v.stock <= 0);

  return (
    <article className="card group bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-[#D4CFC8] transition-all duration-150">
      <div>
        {/* الصورة مع الشارات */}
        <Link href={`/products/${p.slug}`} className="block relative mb-3">
          <ProductPhoto product={p} />
          
          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 pointer-events-none">
            {p.brand?.name_ar ? (
              <span className="bg-amber-50 text-amber-800 text-xs font-semibold rounded-full px-2.5 py-0.5 border border-amber-200/60 shadow-xs">
                {p.brand.name_ar}
              </span>
            ) : <span />}

            {allOut ? (
              <span className="bg-red-50 text-red-700 text-xs font-semibold rounded-full px-2.5 py-0.5 shadow-xs">
                نفد المخزون
              </span>
            ) : discountPct > 0 ? (
              <span className="bg-red-50 text-red-700 text-xs font-semibold rounded-full px-2.5 py-0.5 num shadow-xs">
                خصم {discountPct}%
              </span>
            ) : null}
          </div>
        </Link>

        {/* معلومات العطر */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[#6B6760] dark:text-[#A09C94]">
            <span>{COUNTRY[p.brand?.country] || 'خليجي'}</span>
            <span>·</span>
            <span>{[p.kind || FAMILY[p.family], GENDER[p.gender]].filter(Boolean).join(' · ')}</span>
          </div>

          <h3 className="text-sm sm:text-base font-semibold text-[#1A1814] dark:text-white line-clamp-1 group-hover:text-[#C9A84C] transition-colors duration-150">
            <Link href={`/products/${p.slug}`}>{p.name_ar}</Link>
          </h3>

          {p.name_en ? (
            <p className="text-xs text-[#6B6760] dark:text-[#A09C94] line-clamp-1">{p.name_en}</p>
          ) : null}
        </div>

        {/* الشريط اللوني للنوتات */}
        <div className="mt-3">
          <ScentNotesBar product={p} />
        </div>
      </div>

      {/* السعر والشراء */}
      <div className="mt-4 pt-3 border-t border-[#E8E6E1] dark:border-[#2E2B22] space-y-3">
        {selectedVariant ? (
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[#6B6760] dark:text-[#A09C94]">
              {selectedVariant.label}
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-semibold text-[#1A1814] dark:text-white num">
                {egp(selectedVariant.price)}
              </span>
              {selectedVariant.compare_price && Number(selectedVariant.compare_price) > Number(selectedVariant.price) ? (
                <span className="text-xs text-[#6B6760] line-through num">
                  {egp(selectedVariant.compare_price)}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* زر إضافة الحجم المتاح */}
        {allOut ? (
          <button
            type="button"
            disabled
            className="w-full bg-[#E8E6E1] dark:bg-[#2E2B22] text-[#6B6760] text-sm font-semibold py-2.5 rounded-lg min-h-[44px] cursor-not-allowed"
          >
            غير متاح حالياً
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => handleAdd(selectedVariant, e)}
            disabled={addingState?.id === selectedVariant?.id}
            className="w-full bg-[#1A1814] hover:bg-[#2D2921] text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-150 active:scale-[0.97] min-h-[44px] flex items-center justify-center gap-2"
          >
            {addingState?.id === selectedVariant?.id ? (
              addingState.state === 'loading' ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>جاري الإضافة...</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-white font-semibold animate-bounce">
                  <svg className="w-4 h-4 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>أضيف!</span>
                </span>
              )
            ) : (
              <span>أضف للعربة</span>
            )}
          </button>
        )}
      </div>
    </article>
  );
}
