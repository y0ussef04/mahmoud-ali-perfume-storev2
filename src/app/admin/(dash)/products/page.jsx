import Link from 'next/link';
import { Suspense } from 'react';
import { requireAdmin } from '@/lib/admin-guard';
import { Empty, PageHead, Panel } from '@/components/admin/ui';
import { egp, num } from '@/lib/money';
import { FAMILY, GENDER } from '@/lib/labels';
import { getBrands } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'العطور والمخزون' };

const LOW_AT = 5;

function safeSearch(v) {
  return String(v || '')
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .slice(0, 40);
}

function ProductsTableSkeleton() {
  return (
    <Panel>
      <div className="overflow-x-auto animate-pulse">
        <div className="h-10 w-full bg-hair/40 rounded-lg mb-3" />
        <div className="space-y-3 py-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-12 w-full bg-hair/20 rounded-lg border border-hair/30 flex items-center justify-between px-4"
            >
              <div className="h-4 w-32 bg-hair/40 rounded" />
              <div className="h-4 w-20 bg-hair/30 rounded" />
              <div className="h-4 w-12 bg-hair/30 rounded" />
              <div className="h-4 w-20 bg-hair/40 rounded" />
              <div className="h-4 w-16 bg-hair/40 rounded" />
              <div className="h-5 w-16 bg-hair/30 rounded-full" />
              <div className="h-4 w-24 bg-hair/30 rounded" />
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const getAllAdminProducts = unstable_cache(
  async () => {
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data, error } = await adminClient
      .from('products')
      .select(
        `id, slug, name_ar, name_en, family, gender, is_active, is_featured, created_at,
         brand:brands ( id, name_ar ),
         variants ( id, label, price, stock, is_active )`
      )
      .order('created_at', { ascending: false });
    return { data: data || [], error: error?.message || null };
  },
  ['admin-products-full'],
  { revalidate: 60, tags: ['products'] }
);

async function ProductsTableData({ sp }) {
  await requireAdmin();

  const search = safeSearch(sp?.q).toLowerCase();
  const brandId = /^[0-9a-f-]{36}$/i.test(sp?.brand || '') ? sp.brand : '';
  const only = sp?.only === 'low' || sp?.only === 'off' ? sp.only : '';

  const { data: rows, error } = await getAllAdminProducts();

  let filteredRows = rows || [];
  if (brandId) filteredRows = filteredRows.filter((p) => p.brand?.id === brandId);
  if (search) {
    filteredRows = filteredRows.filter(
      (p) =>
        (p.name_ar && p.name_ar.toLowerCase().includes(search)) ||
        (p.name_en && p.name_en.toLowerCase().includes(search))
    );
  }

  let products = filteredRows.map((p) => {
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

  if (only === 'low') products = products.filter((p) => p.lowCount > 0);
  if (only === 'off') products = products.filter((p) => p.offCount > 0);

  return (
    <Panel>
      {error ? (
        <p className="border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet">
          {error.message}
        </p>
      ) : products.length === 0 ? (
        <Empty>
          {search || brandId || only
            ? 'مافيش عطر مطابق.'
            : 'مافيش عطور لسه. ابدأ بـ "أضف عطر".'}
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
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="text-brass underline underline-offset-4"
                    >
                      {p.name_ar}
                    </Link>
                    <span className="block text-xs2 text-ink-42">
                      {p.brand?.name_ar || '—'}
                      {p.gender ? ` · ${GENDER[p.gender]}` : ''}
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
                          ? 'text-garnet'
                          : p.lowCount > 0
                            ? 'text-brass'
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
  );
}

export default async function AdminProductsPage({ searchParams }) {
  const sp = await searchParams;

  const search = safeSearch(sp?.q);
  const brandId = /^[0-9a-f-]{36}$/i.test(sp?.brand || '') ? sp.brand : '';
  const only = sp?.only === 'low' || sp?.only === 'off' ? sp.only : '';

  // البراندات مجلوبة من الكاش الفوري
  const brands = await getBrands();

  return (
    <>
      <PageHead
        title="العطور والمخزون"
        hint="الأسعار والكميات وحالات العرض في المتجر"
      >
        <Link href="/admin/products/new" className="btn-solid">
          أضف عطر
        </Link>
      </PageHead>

      {/* ── الفلاتر الفورية (تظهر فوراً بدون أي انتظار) ── */}
      <Panel className="mb-5">
        <form method="get" action="/admin/products" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[13rem] flex-1">
            <label htmlFor="p-q" className="label">بحث بالاسم</label>
            <input id="p-q" name="q" defaultValue={search} className="field" placeholder="خمرة" />
          </div>

          <div>
            <label htmlFor="p-brand" className="label">البراند</label>
            <select id="p-brand" name="brand" defaultValue={brandId} className="field">
              <option value="">كل البراندات</option>
              {(brands || []).map((b) => (
                <option key={b.id} value={b.id}>{b.name_ar}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="p-only" className="label">المخزون</label>
            <select id="p-only" name="only" defaultValue={only} className="field">
              <option value="">الكل</option>
              <option value="low">على وشك يخلص</option>
              <option value="off">خلص</option>
            </select>
          </div>

          <button type="submit" className="btn-solid">فلتر</button>

          {search || brandId || only ? (
            <Link href="/admin/products" className="btn-quiet">صفّر</Link>
          ) : null}
        </form>
      </Panel>

      {/* ── جدول العطور المتدفق مع هيكل تحميل فوري ── */}
      <Suspense key={JSON.stringify(sp)} fallback={<ProductsTableSkeleton />}>
        <ProductsTableData sp={sp} />
      </Suspense>
    </>
  );
}
