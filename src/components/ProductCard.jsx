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

  const canExpand = p.variants.length > 4;
  const shownVariants = expanded ? p.variants : p.variants.slice(0, 4);

  return (
    <article className="card group flex flex-col">
      <Spine product={p} />

      {/* الصورة — aria-hidden عشان الاسم تحتيها لينك كفاية للقارئ الصوتي */}
      <Link
        href={`/products/${p.slug}`}
        aria-hidden="true"
        tabIndex={-1}
        className="ms-1.5 block"
      >
        <div className="relative overflow-hidden">
          {/* شارة: نفاد المخزون له الأولوية، وإلا الخصم */}
          {allOut ? (
            <span
              className="absolute top-0 z-10 m-3 border border-hair bg-glass px-2.5 py-1
                         text-xs2 tracking-wide2 text-ink-60"
              style={{ insetInlineStart: 0, borderRadius: 2 }}
            >
              نفد المخزون
            </span>
          ) : discountPct > 0 ? (
            <span
              className="num absolute top-0 z-10 m-3 bg-lacquer px-2.5 py-1 text-xs2
                         tracking-wide2 text-brass-gilt"
              style={{ insetInlineStart: 0, borderRadius: 2 }}
            >
              خصم {discountPct}%
            </span>
          ) : null}

          {/* تكبير خفيف عند المرور — بيتلغي مع تقليل الحركة */}
          <div
            className="transition-transform duration-500 ease-out
                       group-hover:scale-[1.045] motion-reduce:transform-none"
          >
            <ProductPhoto product={p} />
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col ps-6 pe-5 py-5">
        {/* الماركة وبلدها */}
        <p className="flex items-center gap-2 text-xs2 tracking-wide2 text-ink-42">
          <span>{p.brand?.name_ar}</span>
          <span aria-hidden="true">·</span>
          <span>{COUNTRY[p.brand?.country] || ''}</span>
        </p>

        {/* الاسم */}
        <h3 className="mt-1.5 font-display text-d2 leading-snug">
          <Link href={`/products/${p.slug}`} className="hover:text-brass">
            {p.name_ar}
          </Link>
        </h3>
        {p.name_en ? (
          <p className="font-mark text-xs2 tracking-wide2 text-ink-42">{p.name_en}</p>
        ) : null}

        {/* التصنيف */}
        <p className="mt-2.5 text-xs2 text-ink-60">
          {[p.kind || FAMILY[p.family], GENDER[p.gender], p.concentration]
            .filter(Boolean)
            .join(' · ')}
        </p>

        {/* النوتات — سطر واحد مختصر */}
        {p.notes_base?.length ? (
          <p className="mt-2 text-xs2 leading-relaxed text-ink-42">
            {[...(p.notes_top || []), ...(p.notes_heart || []), ...(p.notes_base || [])]
              .slice(0, 5)
              .join(' · ')}
          </p>
        ) : null}

        {/* سجلّ الأحجام — كل حجم بسعره */}
        <div className="mt-4 border-t border-hair-soft pt-1">
          {p.variants.length === 0 ? (
            <p className="py-3 text-xs2 text-ink-42">مافيش أحجام مسجّلة.</p>
          ) : (
            <>
              <ul className="divide-y divide-hair-soft">
                {shownVariants.map((v) => {
                const out = v.stock <= 0;
                const low = !out && v.stock <= 3;
                const off =
                  v.compare_price && Number(v.compare_price) > Number(v.price);
                const isAdded = added === v.id;

                return (
                  <li key={v.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-24 shrink-0 text-xs1 text-oud">{v.label}</span>

                    <span className="num flex-1 text-xs1">
                      {egp(v.price)}
                      {off ? (
                        <span className="ms-2 text-xs2 text-ink-42 line-through">
                          {egp(v.compare_price)}
                        </span>
                      ) : null}
                    </span>

                    {out ? (
                      <span className="shrink-0 text-xs2 text-ink-42">خلص</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addVariant(v)}
                        aria-label={`أضف ${p.name_ar} حجم ${v.label} للعربة`}
                        className={`inline-flex shrink-0 items-center justify-center gap-1
                                    border px-3 py-1.5 text-xs2 tracking-wide2
                                    transition-colors ${
                                      isAdded
                                        ? 'border-sage text-sage'
                                        : 'border-hair text-oud hover:border-lacquer hover:bg-lacquer hover:text-brass-gilt'
                                    }`}
                        style={{ borderRadius: 2, minWidth: '4.5rem' }}
                      >
                        {isAdded ? 'تمّت ✓' : 'أضف'}
                      </button>
                    )}

                    {low ? (
                      <span className="num shrink-0 text-xs2 text-garnet">
                        باقي {v.stock}
                      </span>
                    ) : null}
                  </li>
                );
                })}
              </ul>

              {canExpand ? (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="btn-ghost w-full"
                  >
                    {expanded ? 'قلّل الأحجام' : 'عرض كل الأحجام'}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>

        <Link
          href={`/products/${p.slug}`}
          className="mt-4 self-start text-xs2 tracking-wide2 text-brass underline
                     decoration-hair underline-offset-4 hover:text-oud"
        >
          النوتات والثبات بالتفصيل
        </Link>
      </div>
    </article>
  );
}
