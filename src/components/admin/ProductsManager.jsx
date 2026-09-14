'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Panel, Empty } from '@/components/admin/ui';
import { egp, num } from '@/lib/money';
import { FAMILY, GENDER } from '@/lib/labels';
import { Search, RotateCcw, ExternalLink } from 'lucide-react';

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
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#736B5E] dark:text-[#A8A296] pointer-events-none" />
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
              className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة ضبط</span>
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
          <div className="overflow-x-auto rounded-xl border border-[#E8E6E1] dark:border-[#2E2B22]">
            <table className="tbl">
              <thead>
                <tr>
                  <th>العطر</th>
                  <th className="w-28 text-start">العائلة</th>
                  <th className="w-20 text-center">الأحجام</th>
                  <th className="w-28 text-end">أرخص سعر</th>
                  <th className="w-32 text-center">المخزون</th>
                  <th className="w-24 text-center">الحالة</th>
                  <th className="w-24 text-end">معاينة</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="font-medium text-[#1A1814] dark:text-[#F5F2EB] hover:text-[#C9A84C] transition-colors block"
                      >
                        {p.name_ar}
                      </Link>
                      <span className="block text-[11px] text-[#736B5E] dark:text-[#A8A296] mt-0.5">
                        {p.brand?.name_ar || '—'}
                        {p.gender ? ` · ${GENDER[p.gender] || p.gender}` : ''}
                      </span>
                    </td>

                    <td className="w-28 text-xs text-[#736B5E] dark:text-[#A8A296]">{FAMILY[p.family] || p.family}</td>

                    <td className="num w-20 text-center font-medium">{num(p.variantCount)}</td>

                    <td className="num w-28 text-end font-semibold text-[#C9A84C]">
                      {p.minPrice > 0 ? egp(p.minPrice) : '—'}
                    </td>

                    <td className="w-32 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          p.totalStock === 0
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : p.lowCount > 0
                            ? 'bg-[#C9A84C]/15 text-[#C9A84C]'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {num(p.totalStock)}
                      </span>
                      {p.offCount > 0 ? (
                        <span className="num mt-1 block text-[10px] text-rose-600 dark:text-rose-400">
                          {num(p.offCount)} حجم نفد
                        </span>
                      ) : p.lowCount > 0 ? (
                        <span className="num mt-1 block text-[10px] text-[#C9A84C]">
                          {num(p.lowCount)} حجم أوشك
                        </span>
                      ) : null}
                    </td>

                    <td className="w-24 text-center">
                      <span className="chip text-[11px] px-2 py-0.5 rounded-full" data-on={p.is_active ? '1' : '0'}>
                        {p.is_active ? 'معروض' : 'مخفي'}
                      </span>
                      {p.is_featured ? (
                        <span className="chip mt-1 text-[10px] px-2 py-0.2 rounded-full block w-fit mx-auto">مميّز</span>
                      ) : null}
                    </td>

                    <td className="w-24 text-end">
                      <Link
                        href={`/products/${p.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-[#736B5E] dark:text-[#A8A296] hover:text-[#C9A84C] transition-colors font-medium"
                        prefetch={false}
                      >
                        <span>المتجر</span>
                        <ExternalLink className="w-3 h-3" />
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
