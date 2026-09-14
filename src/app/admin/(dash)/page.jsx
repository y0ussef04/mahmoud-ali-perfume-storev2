import Link from 'next/link';
import { Suspense } from 'react';
import { requirePermission } from '@/lib/admin-guard';
import { Broken, Empty, Kpi, PageHead, Panel, RangeTabs } from '@/components/admin/ui';
import { dateAr, delta, egp, num } from '@/lib/money';
import { PAYMENT_METHOD } from '@/lib/labels';
import AnimateIn from '@/components/AnimateIn';
import { Bell, ArrowUpRight, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'نظرة عامة' };

const ALLOWED_DAYS = [7, 30, 90];
const LOW_STOCK_AT = 5;
const STALE_AFTER = 60;

import { BrandBars, MethodSplit, RevenueChart } from '@/components/admin/Charts';

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* كروت KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#1A1814] p-5 space-y-3">
            <div className="h-3 w-16 bg-black/5 dark:bg-white/5 rounded" />
            <div className="h-7 w-28 bg-black/10 dark:bg-white/10 rounded" />
            <div className="h-3 w-20 bg-black/5 dark:bg-white/5 rounded" />
          </div>
        ))}
      </div>

      {/* الرسوم البيانية */}
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#1A1814] p-6 space-y-4">
          <div className="h-5 w-32 bg-black/10 dark:bg-white/10 rounded" />
          <div className="h-64 w-full bg-black/5 dark:bg-white/5 rounded-xl" />
        </div>
        <div className="rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#1A1814] p-6 space-y-4">
          <div className="h-5 w-24 bg-black/10 dark:bg-white/10 rounded" />
          <div className="h-64 w-full bg-black/5 dark:bg-white/5 rounded-xl" />
        </div>
      </div>

      {/* الجداول */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#1A1814] p-6 space-y-4">
          <div className="h-5 w-36 bg-black/10 dark:bg-white/10 rounded" />
          <div className="space-y-2 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-11 w-full bg-black/5 dark:bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#1A1814] p-6 space-y-4">
          <div className="h-5 w-36 bg-black/10 dark:bg-white/10 rounded" />
          <div className="space-y-2 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-11 w-full bg-black/5 dark:bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

async function DashboardData({ days }) {
  const { supabase } = await requirePermission('dashboard.view');
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
    <AnimateIn className="space-y-6">
      {/* ── محتاج انتباه ── */}
      {(k.new_orders > 0 || k.pending_review > 0) ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#C9A84C]/40 bg-gradient-to-r from-[#C9A84C]/15 via-[#C9A84C]/5 to-transparent px-5 py-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#C9A84C]">
            <Bell className="w-4 h-4 animate-bounce" />
            <span>محتاج انتباه:</span>
          </div>

          {k.new_orders > 0 ? (
            <Link
              href="/admin/orders?status=new"
              className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-[#1A1814] px-3.5 py-1 text-xs font-semibold text-[#1A1814] dark:text-[#F5F2EB] shadow-sm hover:border-[#C9A84C] border border-[#E8E6E1] dark:border-[#2E2B22] transition-colors"
            >
              <span className="num font-bold text-[#C9A84C]">{num(k.new_orders)}</span>
              <span>أوردر جديد مستنّي تأكيد</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#C9A84C]" />
            </Link>
          ) : null}

          {k.pending_review > 0 ? (
            <Link
              href="/admin/orders?payment=pending_review"
              className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-[#1A1814] px-3.5 py-1 text-xs font-semibold text-[#1A1814] dark:text-[#F5F2EB] shadow-sm hover:border-[#C9A84C] border border-[#E8E6E1] dark:border-[#2E2B22] transition-colors"
            >
              <span className="num font-bold text-[#C9A84C]">{num(k.pending_review)}</span>
              <span>تحويل مستنّي مراجعة</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#C9A84C]" />
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* ── الأرقام ── */}
      {kpisRes.error ? (
        <Broken>تعذر جلب الأرقام والإحصائيات: {kpisRes.error.message}</Broken>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Kpi
            label="الإيراد"
            value={egp(k.revenue)}
            trend={revTrend}
            sub="مقارنة بالفترة السابقة"
          />
          <Kpi label="الأوردرات" value={num(k.orders)} trend={ordTrend} />
          <Kpi label="متوسط الأوردر" value={egp(k.aov)} />
          <Kpi label="القطع المباعة" value={num(k.units)} />
          <Kpi
            label="الملغي"
            value={num(k.cancelled)}
            tone={k.cancelled > 0 ? 'warn' : undefined}
            sub="في نفس الفترة"
          />
        </div>
      )}

      {/* ── الإيراد يوم بيوم + طرق الدفع ── */}
      <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <Panel title="الإيراد يوم بيوم" hint="الأوردرات المؤكّدة فقط — الجديد والملغي غير محسوب">
          {seriesRes.error ? (
            <Broken>{seriesRes.error.message}</Broken>
          ) : (
            <RevenueChart data={seriesRes.data || []} />
          )}
        </Panel>

        <Panel title="طرق الدفع" hint={`جميع الأوردرات في آخر ${days} يوم`}>
          <MethodSplit data={methods} />
          <p className="mt-5 border-t border-[#F0EFEA] dark:border-[#26231C] pt-4 text-xs leading-relaxed text-[#736B5E] dark:text-[#A8A296]">
            ارتفاع نسبة الدفع عند الاستلام يزيد من مخاطر الإلغاء ومرتجعات الشحن.
          </p>
        </Panel>
      </div>

      {/* ── الأكثر مبيعاً + البراندات ── */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="أكثر العطور مبيعاً"
          hint={`آخر ${days} يوم · الترتيب حسب الإيراد`}
          action={
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1 rounded-full border border-[#E8E6E1] dark:border-[#2E2B22] px-3 py-1 text-xs font-semibold text-[#736B5E] dark:text-[#A8A296] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
            >
              <span>كل العطور</span>
              <ArrowLeft className="w-3 h-3" />
            </Link>
          }
        >
          {topRes.error ? (
            <Broken>{topRes.error.message}</Broken>
          ) : (topRes.data || []).length === 0 ? (
            <Empty>لا توجد مبيعات مسجلة في هذه الفترة.</Empty>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#E8E6E1] dark:border-[#2E2B22]">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>العطر</th>
                    <th className="w-24 text-center">القطع</th>
                    <th className="w-32 text-end">الإيراد</th>
                  </tr>
                </thead>
                <tbody>
                  {(topRes.data || []).map((r) => (
                    <tr key={r.product_id}>
                      <td>
                        <Link
                          href={`/admin/products/${r.product_id}`}
                          className="font-medium text-[#1A1814] dark:text-[#F5F2EB] hover:text-[#C9A84C] transition-colors block"
                        >
                          {r.product_name}
                        </Link>
                        <span className="block text-[11px] text-[#736B5E] dark:text-[#A8A296] mt-0.5">
                          {r.brand_name || '—'}
                        </span>
                      </td>
                      <td className="num w-24 text-center font-semibold">{num(r.units_sold)}</td>
                      <td className="num w-32 text-end font-semibold text-[#C9A84C]">{egp(r.revenue)}</td>
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
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="تنبيهات المخزون"
          hint={`عطور نفدت أو متبقي منها ${LOW_STOCK_AT} قطع أو أقل`}
          action={
            <Link
              href="/admin/products?only=low"
              className="inline-flex items-center gap-1 rounded-full border border-[#E8E6E1] dark:border-[#2E2B22] px-3 py-1 text-xs font-semibold text-[#736B5E] dark:text-[#A8A296] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
            >
              <span>كل النواقص</span>
              <ArrowLeft className="w-3 h-3" />
            </Link>
          }
        >
          {lowRes.error ? (
            <Broken>{lowRes.error.message}</Broken>
          ) : low.length === 0 ? (
            <Empty>المخزون ممتاز — لا توجد نواقص حرجة.</Empty>
          ) : (
            <>
              {outOfStock.length > 0 ? (
                <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
                  يوجد <span className="num font-bold">{num(outOfStock.length)}</span> أحجام نفدت تماماً ويجب تجديد المخزون.
                </div>
              ) : null}

              <div className="overflow-x-auto rounded-xl border border-[#E8E6E1] dark:border-[#2E2B22]">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>العطر</th>
                      <th className="w-28 text-start">الحجم</th>
                      <th className="w-24 text-center">المتبقي</th>
                      <th className="w-28 text-end">السعر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {low.slice(0, 10).map((r) => (
                      <tr key={r.variant_id}>
                        <td>
                          <Link
                            href={`/admin/products/${r.product_id}`}
                            className="font-medium text-[#1A1814] dark:text-[#F5F2EB] hover:text-[#C9A84C] transition-colors block"
                          >
                            {r.product_name}
                          </Link>
                          <span className="block text-[11px] text-[#736B5E] dark:text-[#A8A296] mt-0.5">
                            {r.brand_name || '—'}
                          </span>
                        </td>
                        <td className="w-28 text-xs text-[#736B5E] dark:text-[#A8A296]">{r.variant_label || 'الأساسي'}</td>
                        <td className="num w-24 text-center">
                          <span
                            className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              r.stock === 0
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : 'bg-[#C9A84C]/15 text-[#C9A84C]'
                            }`}
                          >
                            {num(r.stock)}
                          </span>
                        </td>
                        <td className="num w-28 text-end font-semibold">{egp(r.price)}</td>
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
          hint={`لم تسجل مبيعات منذ أكثر من ${STALE_AFTER} يوماً مع توفر المخزون`}
        >
          {staleRes.error ? (
            <Broken>{staleRes.error.message}</Broken>
          ) : stale.length === 0 ? (
            <Empty>حركة المبيعات ممتازة — لا توجد عطور راكدة.</Empty>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#E8E6E1] dark:border-[#2E2B22]">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>العطر</th>
                    <th className="w-28 text-center">المخزون</th>
                    <th className="w-36 text-end">آخر طلب</th>
                  </tr>
                </thead>
                <tbody>
                  {stale.slice(0, 12).map((r) => (
                    <tr key={r.product_id}>
                      <td>
                        <span className="block font-medium">{r.product_name}</span>
                        <span className="block text-[11px] text-[#736B5E] dark:text-[#A8A296] mt-0.5">
                          {r.brand_name || '—'}
                        </span>
                      </td>
                      <td className="num w-28 text-center font-semibold text-[#C9A84C]">{num(r.total_stock)}</td>
                      <td className="w-36 text-end text-xs text-[#736B5E] dark:text-[#A8A296]">
                        {r.last_sold ? dateAr(r.last_sold) : 'لم يُطلب بعد'}
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
        title="التوزيع الجغرافي ومؤشرات الدفع عند الاستلام"
        hint={`آخر ${days} يوم · نسبة الإلغاء محسوبة على طلبات الدفع عند الاستلام`}
      >
        {geoRes.error ? (
          <Broken>{geoRes.error.message}</Broken>
        ) : geo.length === 0 ? (
          <Empty>لا توجد طلبات في هذه الفترة.</Empty>
        ) : (
          <>
            {codRisk.length > 0 ? (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs leading-relaxed text-rose-700 dark:text-rose-400">
                محافظات تسجل نسبة إلغاء مرتفعة:{' '}
                {codRisk
                  .slice(0, 4)
                  .map((g) => `${g.governorate} (${num(g.cod_cancel_rate)}%)`)
                  .join(' · ')}
                . يُوصى بتأكيد الطلبات عبر اتصال هاتفي أو طلب سداد مسبق.
              </div>
            ) : null}

            <div className="overflow-x-auto rounded-xl border border-[#E8E6E1] dark:border-[#2E2B22]">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>المحافظة</th>
                    <th className="w-24 text-center">الأوردرات</th>
                    <th className="w-32 text-end">الإيراد</th>
                    <th className="w-28 text-center">عند الاستلام</th>
                    <th className="w-24 text-center">الملغي</th>
                    <th className="w-28 text-center">نسبة الإلغاء</th>
                  </tr>
                </thead>
                <tbody>
                  {geo.map((g) => {
                    const rate = Number(g.cod_cancel_rate) || 0;
                    const hot = g.cod_orders >= 3 && rate >= 20;
                    return (
                      <tr key={g.governorate}>
                        <td className="font-medium">{g.governorate}</td>
                        <td className="num w-24 text-center">{num(g.orders)}</td>
                        <td className="num w-32 text-end font-semibold text-[#C9A84C]">{egp(g.revenue)}</td>
                        <td className="num w-28 text-center">{num(g.cod_orders)}</td>
                        <td className="num w-24 text-center">{num(g.cod_cancelled)}</td>
                        <td className="num w-28 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              hot
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : rate > 0
                                ? 'bg-[#C9A84C]/15 text-[#C9A84C]'
                                : 'text-[#736B5E] dark:text-[#A8A296]'
                            }`}
                          >
                            {num(rate)}%
                          </span>
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
    </AnimateIn>
  );
}

export default async function DashboardPage({ searchParams }) {
  const sp = await searchParams;
  const asked = parseInt(sp?.d, 10);
  const days = ALLOWED_DAYS.includes(asked) ? asked : 30;

  return (
    <>
      {/* ── رأس الصفحة وتبويبات المدة الفاخرة ── */}
      <PageHead title="نظرة عامة" hint={`آخر ${days} يوم · تحديث فوري ولحظي`}>
        <RangeTabs days={days} base="/admin" />
      </PageHead>

      {/* ── المحتوى المتدفق مع هيكل تحميل فوري ── */}
      <Suspense key={days} fallback={<DashboardSkeleton />}>
        <DashboardData days={days} />
      </Suspense>
    </>
  );
}
