import Link from 'next/link';
import { Suspense } from 'react';
import { requireAdmin } from '@/lib/admin-guard';
import { BrandBars, MethodSplit, RevenueChart } from '@/components/admin/Charts';
import { Broken, Empty, Kpi, PageHead, Panel, RangeTabs } from '@/components/admin/ui';
import { dateAr, delta, egp, num } from '@/lib/money';
import { PAYMENT_METHOD } from '@/lib/labels';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'نظرة عامة' };

const ALLOWED_DAYS = [7, 30, 90];
const LOW_STOCK_AT = 5;
const STALE_AFTER = 60;

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* الـ 5 كروت KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="surface p-5 space-y-3">
            <div className="h-3 w-16 bg-hair/50 rounded" />
            <div className="h-7 w-28 bg-hair/70 rounded" />
            <div className="h-3 w-20 bg-hair/30 rounded" />
          </div>
        ))}
      </div>

      {/* الرسوم البيانية */}
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="surface p-5 sm:p-6 space-y-4">
          <div className="h-5 w-32 bg-hair/50 rounded" />
          <div className="h-64 w-full bg-hair/20 rounded-lg border border-hair/30" />
        </div>
        <div className="surface p-5 sm:p-6 space-y-4">
          <div className="h-5 w-24 bg-hair/50 rounded" />
          <div className="h-64 w-full bg-hair/20 rounded-lg border border-hair/30" />
        </div>
      </div>

      {/* الجداول السفلية */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="surface p-5 sm:p-6 space-y-4">
          <div className="h-5 w-36 bg-hair/50 rounded" />
          <div className="space-y-2 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-full bg-hair/20 rounded border border-hair/30" />
            ))}
          </div>
        </div>
        <div className="surface p-5 sm:p-6 space-y-4">
          <div className="h-5 w-36 bg-hair/50 rounded" />
          <div className="space-y-2 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-full bg-hair/20 rounded border border-hair/30" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

async function DashboardData({ days }) {
  const { supabase } = await requireAdmin();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const [kpisRes, seriesRes, topRes, brandsRes, lowRes, staleRes, geoRes, ...methodRes] =
    await Promise.all([
      supabase.rpc('admin_kpis', { p_days: days }),
      supabase.rpc('revenue_by_day', { p_days: days }),
      supabase.rpc('top_products', { p_days: days, p_limit: 8 }),
      supabase.rpc('brand_performance', { p_days: days }),
      supabase.rpc('low_stock', { p_threshold: LOW_STOCK_AT }),
      supabase.rpc('stale_products', { p_days: STALE_AFTER }),
      supabase.rpc('geo_breakdown', { p_days: days }),
      ...['cod', 'card', 'wallet'].map((m) =>
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('payment_method', m)
          .gte('created_at', since)
      ),
    ]);

  const k = kpisRes.data || {};
  const revTrend = delta(k.revenue, k.revenue_prev);
  const ordTrend = delta(k.orders, k.orders_prev);

  const methods = ['cod', 'card', 'wallet'].map((key, i) => ({
    key,
    label: PAYMENT_METHOD[key],
    orders: methodRes[i]?.count || 0,
  }));

  const geo = geoRes.data || [];
  const codRisk = geo
    .filter((g) => g.cod_orders >= 3 && Number(g.cod_cancel_rate) >= 20)
    .sort((a, b) => Number(b.cod_cancel_rate) - Number(a.cod_cancel_rate));

  const low = lowRes.data || [];
  const outOfStock = low.filter((r) => r.stock === 0);
  const stale = (staleRes.data || []).filter((r) => Number(r.total_stock) > 0);

  return (
    <>
      {/* ── محتاج انتباه ── */}
      {(k.new_orders > 0 || k.pending_review > 0) ? (
        <div className="mb-7 flex flex-wrap items-center gap-3 border border-brass bg-brass/8 px-4 py-3.5">
          <span className="text-xs2 tracking-wide2 text-brass">محتاج انتباه</span>

          {k.new_orders > 0 ? (
            <Link
              href="/admin/orders?status=new"
              className="text-xs1 text-oud underline decoration-brass underline-offset-4"
            >
              <span className="num">{num(k.new_orders)}</span> أوردر جديد مستنّي تأكيد
            </Link>
          ) : null}

          {k.pending_review > 0 ? (
            <Link
              href="/admin/orders?payment=pending_review"
              className="text-xs1 text-oud underline decoration-brass underline-offset-4"
            >
              <span className="num">{num(k.pending_review)}</span> تحويل مستنّي مراجعة
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* ── الأرقام ── */}
      {kpisRes.error ? (
        <Broken>مانقدرناش نجيب الأرقام: {kpisRes.error.message}</Broken>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Kpi
            label="الإيراد"
            value={egp(k.revenue)}
            trend={revTrend}
            sub="مقارنة بالفترة اللي قبلها"
          />
          <Kpi label="الأوردرات" value={num(k.orders)} trend={ordTrend} />
          <Kpi label="متوسط الأوردر" value={egp(k.aov)} />
          <Kpi label="القطع المبيعة" value={num(k.units)} />
          <Kpi
            label="الملغي"
            value={num(k.cancelled)}
            tone={k.cancelled > 0 ? 'warn' : undefined}
            sub="في نفس الفترة"
          />
        </div>
      )}

      {/* ── الإيراد يوم بيوم ── */}
      <div className="mt-6 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Panel title="الإيراد يوم بيوم" hint="الأوردرات المؤكّدة بس — الجديد والملغي مش محسوب">
          {seriesRes.error ? (
            <Broken>{seriesRes.error.message}</Broken>
          ) : (
            <RevenueChart data={seriesRes.data || []} />
          )}
        </Panel>

        <Panel title="طرق الدفع" hint={`كل الأوردرات في آخر ${days} يوم`}>
          <MethodSplit data={methods} />

          <p className="mt-5 border-t border-hair-soft pt-4 text-xs2 leading-relaxed text-ink-42">
            لو نسبة الدفع عند الاستلام عالية جداً، ده بيزوّد خطر الإلغاء ورسوم
            التحصيل.
          </p>
        </Panel>
      </div>

      {/* ── الأكثر مبيعاً + البراندات ── */}
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel
          title="أكتر عطور مبيعة"
          hint={`آخر ${days} يوم · الترتيب حسب الإيراد`}
          action={
            <Link href="/admin/products" className="btn-quiet">
              كل العطور
            </Link>
          }
        >
          {topRes.error ? (
            <Broken>{topRes.error.message}</Broken>
          ) : (topRes.data || []).length === 0 ? (
            <Empty>مافيش مبيعات في الفترة دي.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>العطر</th>
                    <th className="text-end">القطع</th>
                    <th className="text-end">الإيراد</th>
                  </tr>
                </thead>
                <tbody>
                  {(topRes.data || []).map((r) => (
                    <tr key={r.product_id}>
                      <td>
                        <Link
                          href={`/admin/products/${r.product_id}`}
                          className="text-oud underline decoration-brass underline-offset-4"
                        >
                          {r.product_name}
                        </Link>
                        <span className="block text-xs2 text-ink-42">
                          {r.brand_name || '—'}
                        </span>
                      </td>
                      <td className="num text-end">{num(r.units_sold)}</td>
                      <td className="num text-end">{egp(r.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel
          title="أداء البراندات"
          hint={`مقارنة إيراد كل براند في آخر ${days} يوم`}
        >
          {brandsRes.error ? (
            <Broken>{brandsRes.error.message}</Broken>
          ) : (
            <BrandBars data={brandsRes.data || []} />
          )}
        </Panel>
      </div>

      {/* ── المخزون: ناقص + راكد ── */}
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel
          title="تنبيهات المخزون"
          hint={`عطور خلصت أو فاضل منها ${LOW_STOCK_AT} قطع أو أقل`}
          action={
            <Link href="/admin/products?only=low" className="btn-quiet">
              كل النواقص
            </Link>
          }
        >
          {lowRes.error ? (
            <Broken>{lowRes.error.message}</Broken>
          ) : low.length === 0 ? (
            <Empty>المخزون مظبوط — مافيش نواقص حرجة.</Empty>
          ) : (
            <>
              {outOfStock.length > 0 ? (
                <p className="mb-3 border border-garnet bg-garnet/8 px-3.5 py-2 text-xs2 text-garnet">
                  فيه <span className="num font-bold">{num(outOfStock.length)}</span> أحجام
                  خلصت تماماً ولازم تتجدد.
                </p>
              ) : null}

              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>العطر</th>
                      <th>الحجم</th>
                      <th className="text-end">المتبقي</th>
                      <th className="text-end">السعر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {low.slice(0, 10).map((r) => (
                      <tr key={r.variant_id}>
                        <td>
                          <Link
                            href={`/admin/products/${r.product_id}`}
                            className="text-oud underline decoration-brass underline-offset-4"
                          >
                            {r.product_name}
                          </Link>
                          <span className="block text-xs2 text-ink-42">
                            {r.brand_name || '—'}
                          </span>
                        </td>
                        <td>{r.variant_label}</td>
                        <td className="num text-end">
                          <span
                            className={
                              r.stock === 0
                                ? 'text-garnet font-bold'
                                : 'text-brass font-bold'
                            }
                          >
                            {num(r.stock)}
                          </span>
                        </td>
                        <td className="num text-end">{egp(r.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Panel>

        <Panel
          title="عطور راكدة"
          hint={`مفيهاش مبيعات بقالها أكتر من ${STALE_AFTER} يوم مع وجود مخزون`}
        >
          {staleRes.error ? (
            <Broken>{staleRes.error.message}</Broken>
          ) : stale.length === 0 ? (
            <Empty>مافيش عطر راكد — كله بيتحرّك.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>العطر</th>
                    <th className="text-end">المخزون</th>
                    <th className="text-end">آخر بيعة</th>
                  </tr>
                </thead>
                <tbody>
                  {stale.slice(0, 12).map((r) => (
                    <tr key={r.product_id}>
                      <td>
                        <span className="block">{r.product_name}</span>
                        <span className="block text-xs2 text-ink-42">
                          {r.brand_name || '—'}
                        </span>
                      </td>
                      <td className="num text-end">{num(r.total_stock)}</td>
                      <td className="num text-end text-ink-60">
                        {r.last_sold ? dateAr(r.last_sold) : 'ولا مرة'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {/* ── التوزيع الجغرافي ── */}
      <Panel
        title="التوزيع الجغرافي ومشاكل الدفع عند الاستلام"
        hint={`آخر ${days} يوم · نسبة الإلغاء محسوبة على أوردرات الدفع عند الاستلام بس`}
        className="mt-6"
      >
        {geoRes.error ? (
          <Broken>{geoRes.error.message}</Broken>
        ) : geo.length === 0 ? (
          <Empty>مافيش أوردرات في الفترة دي.</Empty>
        ) : (
          <>
            {codRisk.length > 0 ? (
              <p className="mb-4 border border-garnet bg-garnet/8 px-4 py-3 text-xs1 leading-relaxed text-garnet">
                محافظات نسبة الإلغاء فيها عالية:{' '}
                {codRisk
                  .slice(0, 4)
                  .map((g) => `${g.governorate} (${num(g.cod_cancel_rate)}%)`)
                  .join(' · ')}
                . فكّر تطلب دفع مقدّم فيها، أو أكّد بمكالمة قبل الشحن.
              </p>
            ) : null}

            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>المحافظة</th>
                    <th className="text-end">الأوردرات</th>
                    <th className="text-end">الإيراد</th>
                    <th className="text-end">عند الاستلام</th>
                    <th className="text-end">اتلغى</th>
                    <th className="text-end">نسبة الإلغاء</th>
                  </tr>
                </thead>
                <tbody>
                  {geo.map((g) => {
                    const rate = Number(g.cod_cancel_rate) || 0;
                    const hot = g.cod_orders >= 3 && rate >= 20;
                    return (
                      <tr key={g.governorate}>
                        <td>{g.governorate}</td>
                        <td className="num text-end">{num(g.orders)}</td>
                        <td className="num text-end">{egp(g.revenue)}</td>
                        <td className="num text-end">{num(g.cod_orders)}</td>
                        <td className="num text-end">{num(g.cod_cancelled)}</td>
                        <td
                          className={`num text-end ${
                            hot ? 'text-garnet' : rate > 0 ? 'text-brass' : 'text-ink-42'
                          }`}
                        >
                          {num(rate)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>
    </>
  );
}

export default async function DashboardPage({ searchParams }) {
  const sp = await searchParams;
  const asked = parseInt(sp?.d, 10);
  const days = ALLOWED_DAYS.includes(asked) ? asked : 30;

  return (
    <>
      {/* ── رأس الصفحة وتبويبات المدة (تظهر فوراً بدون أي تأخير) ── */}
      <PageHead title="نظرة عامة" hint={`آخر ${days} يوم · محدَّث الآن`}>
        <RangeTabs days={days} base="/admin" />
      </PageHead>

      {/* ── المحتوى المتدفق مع هيكل تحميل فوري ── */}
      <Suspense key={days} fallback={<DashboardSkeleton />}>
        <DashboardData days={days} />
      </Suspense>
    </>
  );
}
