/*
 * DESIGN DECISIONS:
 * Layout: Responsive catalog grid matching 2 cols on mobile, 3 on tablet, and 4 on desktop.
 * Mobile: Filter controls in compact horizontal row, touch targets >= 44px.
 * Removed: Emojis, background pattern clutter, heavy shadows.
 * RTL notes: Arabic text aligned properly with start/end direction.
 */

'use client';

import { useMemo, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { SpineKey } from '@/components/Spine';
import { egp, num } from '@/lib/money';
import { COUNTRY, FAMILY, GENDER } from '@/lib/labels';

export default function Catalog({ products, brands, initialFamily = '' }) {
  const [family, setFamily] = useState(initialFamily);
  const [brand, setBrand] = useState('');
  const [gender, setGender] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [query, setQuery] = useState('');

  const families = useMemo(
    () => Array.from(new Set(products.map((p) => p.family).filter(Boolean))),
    [products]
  );

  const priceCeiling = useMemo(() => {
    const maxs = products.map((p) => p.maxPrice || 0);
    return Math.ceil((Math.max(...maxs, 2000) + 100) / 100) * 100;
  }, [products]);

  const shown = useMemo(() => {
    return products.filter((p) => {
      if (family && p.family !== family) return false;
      if (brand && p.brand?.slug !== brand) return false;
      if (gender && p.gender !== gender) return false;
      if (inStockOnly && !p.available) return false;

      if (maxPrice) {
        const top = Number(maxPrice);
        if (p.minPrice != null && p.minPrice > top) return false;
      }

      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const haystack = [p.name_ar, p.name_en, p.brand?.name_ar, p.brand?.name_en]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [products, family, brand, gender, maxPrice, inStockOnly, query]);

  const activeCount =
    (family ? 1 : 0) +
    (brand ? 1 : 0) +
    (gender ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (query ? 1 : 0);

  const reset = () => {
    setFamily('');
    setBrand('');
    setGender('');
    setMaxPrice('');
    setInStockOnly(false);
    setQuery('');
  };

  return (
    <div className="space-y-6">
      {/* البحث والعائلة العطرية */}
      <div className="space-y-4 bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-4 sm:p-6">
        <div>
          <label htmlFor="search" className="block text-xs font-semibold text-[#6B6760] dark:text-[#A09C94] mb-1.5">
            البحث في الكاتالوج
          </label>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم العطر أو الماركة..."
            className="w-full bg-[#FAFAF8] dark:bg-[#111009] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-lg px-4 py-2.5 text-sm text-[#1A1814] dark:text-white placeholder-[#6B6760] focus:outline-none focus:border-[#C9A84C] min-h-[44px]"
          />
        </div>

        {/* العائلة العطرية */}
        <div>
          <span className="block text-xs font-semibold text-[#6B6760] dark:text-[#A09C94] mb-2">
            العائلة العطرية
          </span>
          <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
            <button
              type="button"
              onClick={() => setFamily('')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 min-h-[44px] transition-colors duration-150 ${
                family === ''
                  ? 'bg-[#1A1814] text-white dark:bg-white dark:text-[#1A1814]'
                  : 'bg-[#FAFAF8] dark:bg-[#111009] text-[#1A1814] dark:text-white border border-[#E8E6E1] dark:border-[#2E2B22] hover:border-[#C9A84C]'
              }`}
            >
              الكل
            </button>
            {families.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFamily(f === family ? '' : f)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 min-h-[44px] transition-colors duration-150 ${
                  family === f
                    ? 'bg-[#1A1814] text-white dark:bg-white dark:text-[#1A1814]'
                    : 'bg-[#FAFAF8] dark:bg-[#111009] text-[#1A1814] dark:text-white border border-[#E8E6E1] dark:border-[#2E2B22] hover:border-[#C9A84C]'
                }`}
              >
                {FAMILY[f] || f}
              </button>
            ))}
          </div>
        </div>

        {/* الفلاتر المتقدمة */}
        <div className="grid gap-4 sm:grid-cols-3 pt-3 border-t border-[#E8E6E1] dark:border-[#2E2B22]">
          <div>
            <label htmlFor="brand" className="block text-xs font-semibold text-[#6B6760] dark:text-[#A09C94] mb-1.5">
              الماركة
            </label>
            <select
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-[#FAFAF8] dark:bg-[#111009] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-lg px-3 py-2.5 text-xs text-[#1A1814] dark:text-white focus:outline-none focus:border-[#C9A84C] min-h-[44px]"
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
            <label htmlFor="gender" className="block text-xs font-semibold text-[#6B6760] dark:text-[#A09C94] mb-1.5">
              الفئة
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-[#FAFAF8] dark:bg-[#111009] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-lg px-3 py-2.5 text-xs text-[#1A1814] dark:text-white focus:outline-none focus:border-[#C9A84C] min-h-[44px]"
            >
              <option value="">الكل</option>
              {Object.entries(GENDER).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="max" className="block text-xs font-semibold text-[#6B6760] dark:text-[#A09C94] mb-1.5">
              أقصى سعر: <span className="text-[#1A1814] dark:text-white font-semibold num">{maxPrice ? egp(maxPrice) : `${num(priceCeiling)} ج.م`}</span>
            </label>
            <input
              id="max"
              type="range"
              min="200"
              max={priceCeiling}
              step="50"
              value={maxPrice || priceCeiling}
              onChange={(e) => setMaxPrice(Number(e.target.value) >= priceCeiling ? '' : e.target.value)}
              className="w-full accent-[#C9A84C] mt-2"
            />
          </div>
        </div>

        {/* الشريط السفلي للفلاتر */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E8E6E1] dark:border-[#2E2B22]">
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#1A1814] dark:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 accent-[#C9A84C] rounded"
              />
              المتاح في المخزون فقط
            </label>

            <span className="text-xs text-[#6B6760] dark:text-[#A09C94] num">
              {shown.length} من {products.length} عطر
            </span>
          </div>

          {activeCount > 0 ? (
            <button
              type="button"
              onClick={reset}
              className="text-xs font-semibold text-[#9B1C1C] hover:underline"
            >
              مسح الفلاتر ({activeCount})
            </button>
          ) : null}
        </div>
      </div>

      <SpineKey />

      {/* ─── شبكة الكروت (2 للموبايل / 3 للتابلت / 4 للكمبيوتر) ─── */}
      {shown.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-12 text-center space-y-3">
          <p className="text-lg font-semibold text-[#1A1814] dark:text-white">لا توجد عطور مطابقة للبحث</p>
          <p className="text-sm text-[#6B6760] dark:text-[#A09C94]">
            جرب إعادة ضبط الفلاتر للحصول على جميع العطور المتاحة.
          </p>
          <button
            type="button"
            onClick={reset}
            className="border border-[#E8E6E1] text-[#1A1814] dark:text-white hover:bg-[#FAFAF8] rounded-lg px-4 py-2.5 text-sm font-semibold min-h-[44px] mt-2"
          >
            عرض كافة العطور
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {shown.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
