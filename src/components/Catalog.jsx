'use client';

import { useMemo, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { SpineKey } from '@/components/Spine';
import { COUNTRY, FAMILY, FAMILY_ORDER, GENDER } from '@/lib/labels';
import { egp, num } from '@/lib/money';

const SORTS = {
  featured: 'المختار أولاً',
  cheap: 'الأرخص أولاً',
  pricey: 'الأغلى أولاً',
  name: 'أبجدي',
};

export default function Catalog({ products, brands, initialFamily = '' }) {
  const [q, setQ] = useState('');
  const [family, setFamily] = useState(initialFamily);
  const [brand, setBrand] = useState('');
  const [country, setCountry] = useState('');
  const [gender, setGender] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState('featured');

  // العائلات الموجودة فعلاً في الكاتالوج بس
  const families = useMemo(() => {
    const present = new Set(products.map((p) => p.family));
    return FAMILY_ORDER.filter((f) => present.has(f));
  }, [products]);

  const priceCeiling = useMemo(
    () => Math.max(500, ...products.map((p) => p.maxPrice || 0)),
    [products]
  );

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();

    let list = products.filter((p) => {
      if (family && p.family !== family) return false;
      if (brand && p.brand?.slug !== brand) return false;
      if (country && p.brand?.country !== country) return false;
      if (gender && p.gender !== gender) return false;
      if (inStockOnly && !p.available) return false;
      if (maxPrice && (p.minPrice ?? Infinity) > Number(maxPrice)) return false;

      if (needle) {
        const hay = [
          p.name_ar,
          p.name_en,
          p.brand?.name_ar,
          p.brand?.name_en,
          p.kind,
          ...(p.notes_top || []),
          ...(p.notes_heart || []),
          ...(p.notes_base || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }

      return true;
    });

    const by = {
      cheap: (a, b) => (a.minPrice ?? 1e9) - (b.minPrice ?? 1e9),
      pricey: (a, b) => (b.minPrice ?? 0) - (a.minPrice ?? 0),
      name: (a, b) => a.name_ar.localeCompare(b.name_ar, 'ar'),
      featured: (a, b) =>
        Number(b.is_featured) - Number(a.is_featured) ||
        Number(b.available) - Number(a.available),
    };

    return [...list].sort(by[sort] || by.featured);
  }, [products, q, family, brand, country, gender, maxPrice, inStockOnly, sort]);

  const activeCount =
    (family ? 1 : 0) +
    (brand ? 1 : 0) +
    (country ? 1 : 0) +
    (gender ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const reset = () => {
    setQ('');
    setFamily('');
    setBrand('');
    setCountry('');
    setGender('');
    setMaxPrice('');
    setInStockOnly(false);
  };

  return (
    <div>
      {/* ─── البحث ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="q" className="label">
            دوّر باسم العطر أو الماركة أو نوتة
          </label>
          <input
            id="q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="عود · ورد طائفي · لطافة · خمرة"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="sort" className="label">
            الترتيب
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="field"
          >
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── العائلة العطرية ─────────────────────────────── */}
      <div className="mt-6">
        <p className="label">العائلة العطرية</p>
        <div className="flex overflow-x-auto gap-2 pb-2 pt-1 no-scrollbar sm:flex-wrap">
          <button
            type="button"
            onClick={() => setFamily('')}
            data-on={family === '' ? '1' : '0'}
            className="chip shrink-0"
          >
            الكل
          </button>
          {families.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFamily(f === family ? '' : f)}
              data-on={family === f ? '1' : '0'}
              className="chip shrink-0"
            >
              {FAMILY[f]}
            </button>
          ))}
        </div>
      </div>

      {/* ─── باقي الفلاتر ────────────────────────────────── */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="brand" className="label">
            الماركة
          </label>
          <select
            id="brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="field"
          >
            <option value="">كل الماركات</option>
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name_ar} — {COUNTRY[b.country]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="country" className="label">
            بلد الماركة
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="field"
          >
            <option value="">الإمارات والسعودية</option>
            <option value="AE">{COUNTRY.AE}</option>
            <option value="SA">{COUNTRY.SA}</option>
          </select>
        </div>

        <div>
          <label htmlFor="gender" className="label">
            لمين
          </label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="field"
          >
            <option value="">للكل</option>
            {Object.entries(GENDER).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="max" className="label">
            أقصى سعر{' '}
            <span className="num text-oud">
              {maxPrice ? egp(maxPrice) : `${num(priceCeiling)} ج.م`}
            </span>
          </label>
          <input
            id="max"
            type="range"
            min="200"
            max={priceCeiling}
            step="50"
            value={maxPrice || priceCeiling}
            onChange={(e) =>
              setMaxPrice(
                Number(e.target.value) >= priceCeiling ? '' : e.target.value
              )
            }
            className="w-full accent-brass"
          />
        </div>
      </div>

      {/* ─── الشريط السفلي للفلاتر ───────────────────────── */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <label className="inline-flex items-center gap-2 text-xs1 text-ink-60">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="accent-brass"
          />
          المتاح حالاً بس
        </label>

        <span className="num text-xs2 text-ink-42">
          {shown.length} من {products.length} عطر
        </span>

        {activeCount > 0 ? (
          <button type="button" onClick={reset} className="btn-quiet">
            شيل الفلاتر ({activeCount})
          </button>
        ) : null}

        <SpineKey className="ms-auto" />
      </div>

      <div className="rule my-7" />

      {/* ─── النتائج ─────────────────────────────────────── */}
      {shown.length === 0 ? (
        <div className="surface px-6 py-16 text-center">
          <p className="font-display text-d2">مفيش عطر مطابق</p>
          <p className="mt-2 text-xs1 text-ink-60">
            جرّب توسّع الفلاتر، أو ابعتلنا على واتساب واحنا نجيبه لك.
          </p>
          <button type="button" onClick={reset} className="btn-ghost mt-5">
            رجّع كل العطور
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
