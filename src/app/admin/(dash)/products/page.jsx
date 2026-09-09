import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-guard';
import { Empty, PageHead, Panel } from '@/components/admin/ui';
import { egp, num } from '@/lib/money';
import { FAMILY, GENDER } from '@/lib/labels';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'العطور والمخزون' };

const LOW_AT = 5;

function safeSearch(v) {
  return String(v || '')
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .slice(0, 40);
}

export default async function AdminProductsPage({ searchParams }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;

  const search = safeSearch(sp?.q);
  const brandId = /^[0-9a-f-]{36}$/i.test(sp?.brand || '') ? sp.brand : '';
  const only = sp?.only === 'low' || sp?.only === 'off' ? sp.only : '';

  let query = supabase
    .from('products')
    .select(
      `id, slug, name_ar, name_en, family, gender, is_active, is_featured, created_at,
       brand:brands ( id, name_ar ),
       variants ( id, label, price, stock, is_active )`
    )
    .order('created_at', { ascending: false });

  if (brandId) query = query.eq('brand_id', brandId);
  if (search) query = query.or(`name_ar.ilike.%${search}%,name_en.ilike.%${search}%`);

  const [{ data: rows, error }, { data: brands }] = await Promise.all([
    query,
    supabase.from('brands').select('id, name_ar').order('sort'),
  ]);

  let products = (rows || []).map((p) => {
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
    <>
      <PageHead
        title="العطور والمخزون"
        hint={`${num(products.length)} عطر · كل حجم له سعره ومخزونه`}
      >
        <Link href="/admin/products/new" className="btn-solid">
          أضف عطر
        </Link>
      </PageHead>

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
    </>
  );
}
