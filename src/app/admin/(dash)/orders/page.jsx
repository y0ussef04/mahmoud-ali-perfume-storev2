import Link from 'next/link';
import { Suspense } from 'react';
import { requirePermission } from '@/lib/admin-guard';
import { Empty, PageHead, Panel } from '@/components/admin/ui';
import { dateTimeAr, egp, num } from '@/lib/money';
import {
  ORDER_STATUS,
  PAYMENT_METHOD_SHORT,
  PAYMENT_STATUS,
  PAYMENT_STATUS_STYLE,
  STATUS_STYLE,
} from '@/lib/labels';
import AnimateIn from '@/components/AnimateIn';
import { FileSpreadsheet, ChevronRight, ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'الأوردرات' };

import { safePostgrestSearch, safeSearch } from '@/lib/validate';
import OrdersFilter from '@/components/admin/OrdersFilter';

const PER_PAGE = 25;
const STATUSES = ['new', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'];
const PAY_STATUSES = ['unpaid', 'pending_review', 'paid', 'refunded'];

function OrdersTableSkeleton() {
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
              <div className="h-4 w-28 bg-hair/40 rounded" />
              <div className="h-4 w-32 bg-hair/30 rounded" />
              <div className="h-4 w-20 bg-hair/30 rounded" />
              <div className="h-4 w-16 bg-hair/40 rounded" />
              <div className="h-5 w-20 bg-hair/40 rounded-full" />
              <div className="h-5 w-20 bg-hair/40 rounded-full" />
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

const getDefaultOrdersPage = unstable_cache(
  async () => {
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data, count, error } = await adminClient
      .from('orders')
      .select(
        `id, order_no, customer_name, phone, governorate, area, total, items_count,
         payment_method, payment_status, status, created_at`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(0, PER_PAGE - 1);
    return { data: data || [], count: count || 0, error: error?.message || null };
  },
  ['admin-orders-default'],
  { revalidate: 30, tags: ['orders'] }
);

async function OrdersTable({ sp }) {
  const { supabase } = await requirePermission('orders.view');

  const status = STATUSES.includes(sp?.status) ? sp.status : '';
  const payment = PAY_STATUSES.includes(sp?.payment) ? sp.payment : '';
  const search = safePostgrestSearch(sp?.q);
  const page = Math.max(1, parseInt(sp?.page, 10) || 1);
  const from = (page - 1) * PER_PAGE;

  let orders = [];
  let count = 0;
  let error = null;

  if (!status && !payment && !search && page === 1) {
    const res = await getDefaultOrdersPage();
    orders = res.data;
    count = res.count;
    error = res.error ? { message: res.error } : null;
  } else {
    let query = supabase
      .from('orders')
      .select(
        `id, order_no, customer_name, phone, governorate, area, total, items_count,
         payment_method, payment_status, status, created_at`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, from + PER_PAGE - 1);

    if (status) query = query.eq('status', status);
    if (payment) query = query.eq('payment_status', payment);
    if (search) {
      query = query.or(
        `order_no.ilike.%${search}%,phone.ilike.%${search}%,customer_name.ilike.%${search}%`
      );
    }

    const res = await query;
    orders = res.data || [];
    count = res.count || 0;
    error = res.error;
  }

  const total = count || 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const kept = { status, payment, q: search };

  const href = (patch) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...kept, ...patch })) {
      if (v) p.set(k, String(v));
    }
    const s = p.toString();
    return `/admin/orders${s ? `?${s}` : ''}`;
  };

  return (
    <Panel>
      {error ? (
        <p className="border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet">
          {error.message}
        </p>
      ) : (orders || []).length === 0 ? (
        <Empty>
          {status || payment || search
            ? 'مافيش أوردر مطابق للفلتر.'
            : 'أول أوردر لسه مجاش. لما يجي هيظهر هنا فوراً.'}
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E8E6E1] dark:border-[#2E2B22]">
          <table className="tbl">
            <thead>
              <tr>
                <th className="w-28 text-start">الأوردر</th>
                <th>العميل</th>
                <th className="w-32 text-start">المحافظة</th>
                <th className="w-28 text-end">الإجمالي</th>
                <th className="w-32 text-center">الدفع</th>
                <th className="w-28 text-center">الحالة</th>
                <th className="w-36 text-end">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="w-28">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="num font-mark font-bold text-[#C9A84C] hover:underline"
                      dir="ltr"
                    >
                      {o.order_no}
                    </Link>
                    <span className="num mt-0.5 block text-[11px] text-[#736B5E] dark:text-[#A8A296]">
                      {num(o.items_count)} قطعة
                    </span>
                  </td>

                  <td>
                    <span className="block font-medium">{o.customer_name}</span>
                    <span className="num block text-[11px] text-[#736B5E] dark:text-[#A8A296]" dir="ltr">
                      {o.phone}
                    </span>
                  </td>

                  <td className="w-32">
                    <span className="block font-medium">{o.governorate}</span>
                    <span className="block text-[11px] text-[#736B5E] dark:text-[#A8A296]">{o.area}</span>
                  </td>

                  <td className="num w-28 text-end font-semibold text-[#C9A84C]">{egp(o.total)}</td>

                  <td className="w-32 text-center">
                    <span className="block text-xs font-medium">
                      {PAYMENT_METHOD_SHORT[o.payment_method] || o.payment_method}
                    </span>
                    <span
                      className={`chip mt-1 text-[11px] px-2 py-0.5 rounded-full inline-flex ${PAYMENT_STATUS_STYLE[o.payment_status] || ''}`}
                    >
                      {PAYMENT_STATUS[o.payment_status]}
                    </span>
                  </td>

                  <td className="w-28 text-center">
                    <span className={`chip text-[11px] px-2 py-0.5 rounded-full inline-flex ${STATUS_STYLE[o.status] || ''}`}>
                      {ORDER_STATUS[o.status]}
                    </span>
                  </td>

                  <td className="num w-36 text-end text-xs text-[#736B5E] dark:text-[#A8A296]">
                    {dateTimeAr(o.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── الصفحات ── */}
      {pages > 1 ? (
        <div className="mt-6 flex items-center justify-between border-t border-[#E8E6E1] dark:border-[#2E2B22] pt-4">
          {page > 1 ? (
            <Link
              href={href({ page: page - 1 })}
              className="inline-flex items-center gap-1 rounded-full border border-[#E8E6E1] dark:border-[#2E2B22] px-3.5 py-1.5 text-xs font-semibold text-[#1A1814] dark:text-[#F5F2EB] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>الأحدث</span>
            </Link>
          ) : (
            <span />
          )}

          <span className="num text-xs font-semibold text-[#736B5E] dark:text-[#A8A296]">
            صفحة {num(page)} من {num(pages)}
          </span>

          {page < pages ? (
            <Link
              href={href({ page: page + 1 })}
              className="inline-flex items-center gap-1 rounded-full border border-[#E8E6E1] dark:border-[#2E2B22] px-3.5 py-1.5 text-xs font-semibold text-[#1A1814] dark:text-[#F5F2EB] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
            >
              <span>الأقدم</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </Panel>
  );
}

export default async function OrdersPage({ searchParams }) {
  const sp = await searchParams;

  const status = STATUSES.includes(sp?.status) ? sp.status : '';
  const payment = PAY_STATUSES.includes(sp?.payment) ? sp.payment : '';
  const search = safeSearch(sp?.q);
  const kept = { status, payment, q: search };

  const exportHref = (() => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(kept)) if (v) p.set(k, String(v));
    const s = p.toString();
    return `/api/admin/export/orders${s ? `?${s}` : ''}`;
  })();

  return (
    <AnimateIn>
      <PageHead
        title="الأوردرات"
        hint="متابعة وتأكيد طلبات المتجر مع تحديث فوري للحالة"
      >
        <a
          href={exportHref}
          className="inline-flex items-center gap-2 rounded-full border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#1A1814] px-4 py-2 text-xs font-semibold text-[#1A1814] dark:text-[#F5F2EB] shadow-sm hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#C9A84C]" />
          <span>تصدير Excel</span>
        </a>
      </PageHead>

      {/* ── الفلاتر الفورية وسلسة التنقل بدون إعادة تحميل الصفحة ── */}
      <OrdersFilter
        currentStatus={status}
        currentPayment={payment}
        currentSearch={search}
      />

      {/* ── جدول الأوردرات المتدفق مع هيكل تحميل فوري ── */}
      <Suspense key={JSON.stringify(sp)} fallback={<OrdersTableSkeleton />}>
        <OrdersTable sp={sp} />
      </Suspense>
    </AnimateIn>
  );
}
