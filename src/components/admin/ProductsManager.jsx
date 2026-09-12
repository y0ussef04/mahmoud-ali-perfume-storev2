'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Panel, Empty } from '@/components/admin/ui';
import { egp, num } from '@/lib/money';
import { FAMILY, GENDER } from '@/lib/labels';

const LOW_AT = 5;

export default function ProductsManager({ initialProducts = [], brands = [] }) {
  const [search, setSearch] = useState('');
  const [brandId, setBrandId] = useState('');
  const [only, setOnly] = useState(''); // '' | 'low' | 'off'

  // معالجة وحساب أسعار ومخزون العطور
  const preparedProducts = useMemo(() => {
    return initialProducts.map((p) => {
      const live = (p.variants || []).filter((v) => v.is_active);
      const prices = live.map((v) => Number(v.price)).filter((n) => n > 0);
      return {
        ...p,
        minPrice: prices.length ? Math.min(...prices) : 0,
        totalStock: live.reduce((s, v) => s + (Number(v.stock) || 0), 0),
        lowCount: live.filter((v) => v.stock > 0 && v.stock <= LOW_AT).length,
        offCount: live.filter((v) => v.stock === 0).length,
        variantCount: live.length,
      };
    });
  }, [initialProducts]);

  // تصفية لحظية في الذاكرة (0ms) بدون أي طلب شبكي أو إعادة تحميل صفحة
  const filtered = useMemo(() => {
    let list = preparedProducts;

    if (brandId) {
      list = list.filter((p) => p.brand?.id === brandId);
    }

    if (only === 'low') {
      list = list.filter((p) => p.lowCount > 0);
    } else if (only === 'off') {
      list = list.filter((p) => p.offCount > 0);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.name_ar && p.name_ar.toLowerCase().includes(q)) ||
          (p.name_en && p.name_en.toLowerCase().includes(q))
      );
    }

    return list;
  }, [preparedProducts, brandId, only, search]);

  const hasFilter = !!(search || brandId || only);

  function resetFilters() {
    setSearch('');
    setBrandId('');
    setOnly('');
  }

  return (
    <>
      {/* ── لوحة الفلترة اللحظية (0ms) ── */}
      <Panel className="mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[14rem] flex-1">
            <label htmlFor="pm-q" className="label">
              بحث بالاسم <span className="text-xs2 text-ink-42">(لحظي)</span>
            </label>
            <div className="relative">
              <input
                id="pm-q"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="field ps-9"
                placeholder="ابحث بالاسم العربي أو الإنجليزي (مثال: خمرة)..."
              />
              <svg
                className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-42 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <div className="min-w-[10rem]">
            <label htmlFor="pm-brand" className="label">
              البراند
            </label>
            <select
              id="pm-brand"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="field cursor-pointer"
            >
              <option value="">كل البراندات ({brands.length})</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name_ar}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[10rem]">
            <label htmlFor="pm-only" className="label">
              المخزون
            </label>
            <select
              id="pm-only"
              value={only}
              onChange={(e) => setOnly(e.target.value)}
              className="field cursor-pointer"
            >
              <option value="">الكل</option>
              <option value="low">على وشك يخلص (≤ 5 قطع)</option>
              <option value="off">نفد من المخزون (0)</option>
            </select>
          </div>

          {hasFilter ? (
            <button
              type="button"
              onClick={resetFilters}
              className="btn-quiet text-garnet font-medium h-[2.9rem] flex items-center gap-1.5"
            >
              <span>صفّر الفلتر</span>
            </button>
          ) : null}
        </div>

        {/* شريط الإحصائية اللحظية */}
        <div className="mt-3.5 flex items-center justify-between border-t border-hair-soft pt-3 text-xs2 text-ink-60">
          <div>
            يتم عرض <span className="font-semibold text-brass num">{filtered.length}</span> من أصل{' '}
            <span className="font-semibold num">{preparedProducts.length}</span> عطر
          </div>
          {hasFilter && (
            <div className="text-brass-light flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-brass animate-pulse" />
              فلترة لحظية مفعّلة
            </div>
          )}
        </div>
      </Panel>

      {/* ── جدول العطور اللحظي ── */}
      <Panel>
        {filtered.length === 0 ? (
          <Empty>
            {hasFilter
              ? 'لا يوجد أي عطر يطابق خيارات البحث الحالية.'
              : 'مافيش عطور لسه. ابدأ بـ أضف عطر.'}
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>العطر</th>
                  <th>العائلة</th>
                  <th className="text-end">الأحجام</th>
                  <th className="text-end">أرخص سعر</th>
                  <th className="text-end">المخزون</th>
                  <th>الحالة</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="text-brass underline underline-offset-4 hover:text-brass-light font-medium"
                      >
                        {p.name_ar}
                      </Link>
                      <span className="block text-xs2 text-ink-42">
                        {p.brand?.name_ar || '—'}
                        {p.gender ? ` · ${GENDER[p.gender] || p.gender}` : ''}
                      </span>
                    </td>

                    <td className="text-xs2">{FAMILY[p.family] || p.family}</td>

                    <td className="num text-end">{num(p.variantCount)}</td>

                    <td className="num text-end">
                      {p.minPrice > 0 ? egp(p.minPrice) : '—'}
                    </td>

                    <td className="num text-end">
                      <span
                        className={
                          p.totalStock === 0
                            ? 'text-garnet font-semibold'
                            : p.lowCount > 0
                            ? 'text-brass font-semibold'
                            : 'text-oud'
                        }
                      >
                        {num(p.totalStock)}
                      </span>
                      {p.offCount > 0 ? (
                        <span className="num mt-0.5 block text-xs2 text-garnet">
                          {num(p.offCount)} حجم خلص
                        </span>
                      ) : p.lowCount > 0 ? (
                        <span className="num mt-0.5 block text-xs2 text-brass">
                          {num(p.lowCount)} حجم قرّب يخلص
                        </span>
                      ) : null}
                    </td>

                    <td>
                      <span className="chip" data-on={p.is_active ? '1' : '0'}>
                        {p.is_active ? 'معروض' : 'مخفي'}
                      </span>
                      {p.is_featured ? (
                        <span className="chip mt-1 block w-fit">مميّز</span>
                      ) : null}
                    </td>

                    <td className="text-end">
                      <Link
                        href={`/products/${p.slug}`}
                        target="_blank"
                        className="btn-quiet"
                        prefetch={false}
                      >
                        شوفه في المتجر
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
