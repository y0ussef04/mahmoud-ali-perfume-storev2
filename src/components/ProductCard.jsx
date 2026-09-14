/*
 * DESIGN DECISIONS:
 * Layout: Refined luxury perfume card focusing on bottle image, brand, title, clear price/discount, and 1-click add-to-cart.
 * Mobile: Optimized 2-column mobile scanability, equal heights, 44px min-h touch target.
 * Details: Scent notes & exhaustive pyramids kept for the Product Details Page.
 */

'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import ProductPhoto from '@/components/ProductPhoto';
import { useCart } from '@/lib/cart';
import { egp } from '@/lib/money';
import { ShoppingBag } from 'lucide-react';

export default function ProductCard({ product: p }) {
  const { add } = useCart();
  const [addingState, setAddingState] = useState(null); // { id, state: 'loading' | 'success' }
  const timerRef = useRef(null);

  const selectedVariant = p.variants?.[0] || null;

  const handleAdd = (v, e) => {
    if (e) e.preventDefault();
    if (!v || v.stock <= 0) return;

    // Step 1: Loading state
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

  // أقصى نسبة خصم للأحجام
  const discountPct = p.variants?.reduce((max, v) => {
    if (v.compare_price && Number(v.compare_price) > Number(v.price)) {
      const pct = Math.round((1 - Number(v.price) / Number(v.compare_price)) * 100);
      return Math.max(max, pct);
    }
    return max;
  }, 0) || 0;

  const allOut = p.variants?.length > 0 && p.variants.every((v) => v.stock <= 0);

  return (
    <article className="card group bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-3 sm:p-4 flex flex-col justify-between hover:shadow-md hover:border-[#C9A84C]/50 transition-all duration-200">
      <div>
        {/* الصورة مع شارات الحالة */}
        <Link href={`/products/${p.slug}`} className="block relative mb-3 rounded-lg overflow-hidden bg-[#FAFAF8] dark:bg-[#151410]">
          <ProductPhoto product={p} />
          
          {/* شارات الخصم ونفاد المخزون */}
          <div className="absolute top-2 end-2 flex items-center gap-1 pointer-events-none">
            {allOut ? (
              <span className="bg-neutral-900/80 text-white text-[11px] font-semibold rounded-md px-2 py-0.5 backdrop-blur-xs">
                نفد المخزون
              </span>
            ) : discountPct > 0 ? (
              <span className="bg-red-600 text-white text-[11px] font-bold rounded-md px-2 py-0.5 num shadow-xs">
                خصم {discountPct}%
              </span>
            ) : null}
          </div>
        </Link>

        {/* الماركة واسم العطر بتسلسل راقي */}
        <div className="space-y-1">
          {p.brand?.name_ar ? (
            <p className="text-[11px] font-semibold text-[#C9A84C] tracking-wide truncate">
              {p.brand.name_ar}
            </p>
          ) : null}

          <h3 className="text-sm sm:text-base font-semibold text-[#1A1814] dark:text-white line-clamp-1 group-hover:text-[#C9A84C] transition-colors duration-150">
            <Link href={`/products/${p.slug}`}>{p.name_ar}</Link>
          </h3>

          {p.name_en ? (
            <p className="text-[11px] text-[#8C877D] dark:text-[#A09C94] line-clamp-1">
              {p.name_en}
            </p>
          ) : null}
        </div>
      </div>

      {/* السعر والشراء بتصميم نظيف وسريع */}
      <div className="mt-3.5 pt-3 border-t border-[#E8E6E1] dark:border-[#2E2B22] space-y-2.5">
        {selectedVariant ? (
          <div className="flex items-baseline justify-between gap-1.5 flex-wrap">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-[#1A1814] dark:text-white num">
                {egp(selectedVariant.price)}
              </span>
              {selectedVariant.compare_price && Number(selectedVariant.compare_price) > Number(selectedVariant.price) ? (
                <span className="text-xs text-[#A09C94] line-through num">
                  {egp(selectedVariant.compare_price)}
                </span>
              ) : null}
            </div>

            {selectedVariant.label ? (
              <span className="text-[11px] font-medium text-[#6B6760] dark:text-[#A09C94] bg-[#FAFAF8] dark:bg-[#25221B] px-1.5 py-0.5 rounded border border-[#E8E6E1]/80 dark:border-[#2E2B22]">
                {selectedVariant.label}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* زر الإجراء السريع (Premium Pill Button) */}
        {allOut ? (
          <button
            type="button"
            disabled
            className="w-full bg-[#E8E6E1] dark:bg-[#2E2B22] text-[#8C877D] text-xs font-semibold py-2.5 rounded-full min-h-[40px] cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 opacity-50" strokeWidth={1.5} />
            <span>غير متاح حالياً</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => handleAdd(selectedVariant, e)}
            disabled={addingState?.id === selectedVariant?.id}
            className="w-full group/btn relative overflow-hidden bg-gradient-to-r from-[#1A1814] to-[#2D2921] dark:from-[#C9A84C] dark:to-[#8B6914] text-white text-xs font-semibold py-2.5 rounded-full transition-all duration-300 active:scale-[0.97] min-h-[40px] flex items-center justify-center shadow-md hover:shadow-lg hover:shadow-[#C9A84C]/20"
          >
            {/* لمعة خفيفة عند المرور */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
            
            <div className="relative flex items-center justify-center gap-2">
              {addingState?.id === selectedVariant?.id ? (
                addingState.state === 'loading' ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>جاري الإضافة...</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-white font-semibold">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>تمت الإضافة</span>
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 transition-transform duration-300 group-hover/btn:scale-110" strokeWidth={1.5} />
                  <span>أضف للعربة</span>
                </span>
              )}
            </div>
          </button>
        )}
      </div>
    </article>
  );
}

