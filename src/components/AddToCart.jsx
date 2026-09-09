'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart';
import { egp } from '@/lib/money';

/** اختيار الحجم والكمية — في صفحة العطر */
export default function AddToCart({ product: p }) {
  const { add } = useCart();
  const [variantId, setVariantId] = useState(p.defaultVariantId);
  const [qty, setQty] = useState(1);

  const v = p.variants.find((x) => x.id === variantId) || null;
  const out = !v || v.stock <= 0;

  const submit = () => {
    if (!v || out) return;
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
    setQty(1);
  };

  return (
    <div>
      {/* ─── الأحجام ─────────────────────────────────────── */}
      <fieldset>
        <legend className="label">الحجم</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {p.variants.map((x) => {
            const gone = x.stock <= 0;
            const on = x.id === variantId;
            const off = x.compare_price && Number(x.compare_price) > Number(x.price);

            return (
              <label
                key={x.id}
                className={`flex cursor-pointer items-center justify-between gap-3 border px-4 py-3
                            transition-colors ${
                              gone
                                ? 'cursor-not-allowed border-hair-soft opacity-45'
                                : on
                                  ? 'border-lacquer bg-lacquer text-brass-gilt'
                                  : 'border-hair-soft hover:border-brass'
                            }`}
                style={{ borderRadius: 2 }}
              >
                <span className="flex items-center gap-3">
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
                    className="accent-brass"
                  />
                  <span className="text-xs1">{x.label}</span>
                </span>

                <span className="num text-xs1">
                  {gone ? (
                    <span className="text-xs2">خلص</span>
                  ) : (
                    <>
                      {egp(x.price)}
                      {off ? (
                        <span
                          className={`ms-2 text-xs2 line-through ${
                            on ? 'text-brass/60' : 'text-ink-42'
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
      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <span className="label">الكمية</span>
          <div className="inline-flex items-stretch border border-hair-soft">
            <button
              type="button"
              onClick={() => setQty((n) => Math.max(1, n - 1))}
              disabled={qty <= 1}
              aria-label="أقلّ"
              className="px-4 text-ink-60 hover:bg-brass/10 disabled:opacity-35"
            >
              −
            </button>
            <span className="num w-12 py-2.5 text-center">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((n) => Math.min(v?.stock ?? 1, n + 1))}
              disabled={!v || qty >= v.stock}
              aria-label="أكتر"
              className="px-4 text-ink-60 hover:bg-brass/10 disabled:opacity-35"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={out}
          className="btn-solid flex-1 py-3.5"
        >
          {out ? 'الحجم ده خلص' : `أضف للعربة — ${egp((Number(v.price) || 0) * qty)}`}
        </button>
      </div>

      {v && v.stock > 0 && v.stock <= 3 ? (
        <p className="num mt-3 text-xs2 text-garnet">
          باقي {v.stock} بس من الحجم ده في المخزن.
        </p>
      ) : null}

      {!p.available ? (
        <p className="mt-3 text-xs2 text-ink-60">
          كل الأحجام خلصت حالياً. ابعتلنا على واتساب ونبلّغك أول ما يوصل.
        </p>
      ) : null}
    </div>
  );
}
