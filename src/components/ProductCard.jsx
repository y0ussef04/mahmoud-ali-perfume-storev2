'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import Spine from '@/components/Spine';
import ProductPhoto from '@/components/ProductPhoto';
import { useCart } from '@/lib/cart';
import { egp } from '@/lib/money';
import { COUNTRY, FAMILY, GENDER } from '@/lib/labels';

/**
 * كارت العطر.
 * القرار المهم هنا: كل الأحجام بأسعارها ظاهرة من غير أي كليك.
 * ده الحل المباشر لمشكلة "مفيش كاتالوج بأسعار واضحة".
 *
 * التحسينات: شارة خصم على الصورة، تكبير خفيف للصورة عند المرور،
 * ورجع فوري "تمّت ✓" على زر الإضافة — كلها تفاعلات بتوصّل حالة مش زينة.
 */
export default function ProductCard({ product: p }) {
  const { add } = useCart();
  const [added, setAdded] = useState(null); // id الحجم اللي اتضاف للتوّ
  const [expanded, setExpanded] = useState(false);
  const timer = useRef(null);

  const addVariant = (v) => {
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

    // رجع بصري سريع على الزر نفسه (بالإضافة للتوست العام)
    setAdded(v.id);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(null), 1300);
  };

  // أعلى نسبة خصم على أي حجم — للشارة على الصورة
  const discountPct = p.variants.reduce((max, v) => {
    if (v.compare_price && Number(v.compare_price) > Number(v.price)) {
      const pct = Math.round((1 - Number(v.price) / Number(v.compare_price)) * 100);
      return Math.max(max, pct);
    }
    return max;
  }, 0);

  const allOut = p.variants.length > 0 && p.variants.every((v) => v.stock <= 0);

  const canExpand = p.variants.length > 3;
  const shownVariants = expanded ? p.variants : p.variants.slice(0, 3);

  return (
    <article className="card group flex flex-col justify-between rounded-md overflow-hidden border border-hair-soft bg-glass/80 backdrop-blur-xs transition-all duration-300 ease-out hover:border-brass-gilt/70 hover:shadow-2xl hover:-translate-y-1 hover:bg-glass">
      <Spine product={p} />

      {/* الصورة — مخصصة للهواتف وبأقصى تناسق */}
      <Link
        href={`/products/${p.slug}`}
        aria-hidden="true"
        tabIndex={-1}
        className="ms-1 sm:ms-1.5 block relative group/img cursor-pointer overflow-hidden"
      >
        <div className="relative overflow-hidden bg-lacquer/30 rounded-t-sm">
          {/* شارة: نفاد المخزون له الأولوية، وإلا الخصم */}
          {allOut ? (
            <span
              className="absolute top-1.5 z-10 m-1.5 border border-hair bg-glass/90 backdrop-blur-xs px-1.5 py-0.5
                         text-[10px] sm:text-xs2 tracking-wide2 text-ink-60 shadow-sm"
              style={{ insetInlineStart: 0, borderRadius: 3 }}
            >
              نفد المخزون
            </span>
          ) : discountPct > 0 ? (
            <span
              className="num absolute top-1.5 z-10 m-1.5 bg-lacquer/90 backdrop-blur-xs border border-brass-gilt/40 px-1.5 py-0.5 text-[10px] sm:text-xs2
                         tracking-wide2 text-brass-gilt font-bold shadow-md"
              style={{ insetInlineStart: 0, borderRadius: 3 }}
            >
              خصم {discountPct}%
            </span>
          ) : null}

          {/* طبقة تفاعلية عند تحويم الماوس */}
          <div className="absolute inset-0 z-10 bg-lacquer/20 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="bg-brass-gilt/90 text-lacquer text-[11px] sm:text-xs2 font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xs shadow-md transform translate-y-2 group-hover/img:translate-y-0 transition-transform duration-300">
              استكشف العطر ➔
            </span>
          </div>

          <ProductPhoto product={p} aspect="aspect-[16/10] max-h-28 sm:max-h-36" />
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-2.5 sm:px-4 py-2 sm:py-3">
        {/* الماركة وبلدها */}
        <p className="flex items-center gap-1 text-[11px] sm:text-xs2 tracking-wide2 text-ink-42">
          <span className="font-medium text-brass-gilt/90">{p.brand?.name_ar}</span>
          <span aria-hidden="true">·</span>
          <span>{COUNTRY[p.brand?.country] || ''}</span>
        </p>

        {/* الاسم */}
        <h3 className="mt-0.5 font-display text-xs1 sm:text-d2 leading-snug font-medium group-hover:text-brass-gilt transition-colors">
          <Link href={`/products/${p.slug}`}>
            {p.name_ar}
          </Link>
        </h3>
        {p.name_en ? (
          <p className="font-mark text-[10px] sm:text-xs2 tracking-wide2 text-ink-42 line-clamp-1">{p.name_en}</p>
        ) : null}

        {/* التصنيف والنوتات */}
        <p className="mt-0.5 text-[11px] sm:text-xs2 text-ink-60 line-clamp-1">
          {[p.kind || FAMILY[p.family], GENDER[p.gender]]
            .filter(Boolean)
            .join(' · ')}
        </p>

        {/* سجلّ الأحجام — التخطيط المتجاوب للهاتف */}
        <div className="mt-2 border-t border-hair-soft/50 pt-1 flex-1 flex flex-col justify-end">
          {p.variants.length === 0 ? (
            <p className="py-1 text-[11px] sm:text-xs2 text-ink-42">مافيش أحجام مسجّلة.</p>
          ) : (
            <>
              <ul className="divide-y divide-hair-soft/40">
                {shownVariants.map((v) => {
                  const out = v.stock <= 0;
                  const low = !out && v.stock <= 3;
                  const off =
                    v.compare_price && Number(v.compare_price) > Number(v.price);
                  const isAdded = added === v.id;

                  return (
                    <li key={v.id} className="flex items-center gap-1 py-1 text-[11px] sm:text-xs1 transition-colors hover:bg-brass/5 px-0.5 rounded-xs">
                      <span className="w-14 sm:w-20 shrink-0 text-[11px] sm:text-xs2 font-medium text-oud truncate">{v.label}</span>

                      <span className="num flex-1 text-[11px] sm:text-xs1 font-bold text-brass-gilt">
                        {egp(v.price)}
                        {off ? (
                          <span className="ms-0.5 text-[10px] sm:text-xs2 text-ink-42 line-through font-normal">
                            {egp(v.compare_price)}
                          </span>
                        ) : null}
                      </span>

                      {out ? (
                        <span className="shrink-0 text-[10px] sm:text-xs2 text-ink-42">خلص</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addVariant(v)}
                          aria-label={`أضف ${p.name_ar} حجم ${v.label} للعربة`}
                          className={`inline-flex shrink-0 items-center justify-center gap-0.5
                                      border px-1.5 sm:px-2.5 py-0.5 text-[10px] sm:text-xs2 tracking-wide2
                                      transition-all duration-200 active:scale-95 ${
                                        isAdded
                                          ? 'border-sage bg-sage/20 text-sage font-bold scale-105'
                                          : 'border-hair/80 text-oud hover:border-brass-gilt hover:bg-brass-gilt hover:text-lacquer font-medium'
                                      }`}
                          style={{ borderRadius: 3, minWidth: '3.2rem' }}
                        >
                          {isAdded ? 'تمّت ✓' : '+ أضف'}
                        </button>
                      )}

                      {low ? (
                        <span className="num shrink-0 text-[10px] sm:text-xs2 text-garnet font-medium">
                          باقي {v.stock}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              {canExpand ? (
                <div className="mt-1">
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="btn-quiet w-full text-[10px] sm:text-xs2 py-0.5 hover:text-brass-gilt transition-colors"
                  >
                    {expanded ? 'إخفاء الأثر' : `عرض باقي الأحجام (+${p.variants.length - 3})`}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="mt-1.5 pt-1 border-t border-hair-soft/30 flex items-center justify-between">
          <Link
            href={`/products/${p.slug}`}
            className="text-[11px] sm:text-xs2 tracking-wide2 text-brass underline
                       decoration-hair underline-offset-4 hover:text-brass-gilt transition-colors"
          >
            التفاصيل والنوتات ➔
          </Link>
        </div>
      </div>
    </article>
  );
}
