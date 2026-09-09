import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-guard';
import { Empty, PageHead, Panel } from '@/components/admin/ui';
import { dateTimeAr, egp, num } from '@/lib/money';
import {
  ORDER_STATUS,
  PAYMENT_METHOD_SHORT,
  PAYMENT_STATUS,
  PAYMENT_STATUS_STYLE,
  STATUS_STYLE,
} from '@/lib/labels';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'الأوردرات' };

const PER_PAGE = 25;
const STATUSES = ['new', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'];
const PAY_STATUSES = ['unpaid', 'pending_review', 'paid', 'refunded'];

/**
 * البحث بيتحوّل لتعبير PostgREST، والفاصلة والأقواس ليها معنى هناك.
 * فبنشيل أي حرف مش حرف ولا رقم ولا مسافة ولا شرطة.
 */
function safeSearch(v) {
  return String(v || '')
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .slice(0, 40);
}

export default async function OrdersPage({ searchParams }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;

  const status = STATUSES.includes(sp?.status) ? sp.status : '';
  const payment = PAY_STATUSES.includes(sp?.payment) ? sp.payment : '';
  const search = safeSearch(sp?.q);
  const page = Math.max(1, parseInt(sp?.page, 10) || 1);
  const from = (page - 1) * PER_PAGE;

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

  const { data: orders, count, error } = await query;

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

  // التصدير بياخد نفس الفلتر — اللي شايفه هو اللي بينزل
  const exportHref = (() => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(kept)) if (v) p.set(k, String(v));
    const s = p.toString();
    return `/api/admin/export/orders${s ? `?${s}` : ''}`;
  })();

  return (
    <>
      <PageHead
        title="الأوردرات"
        hint={
          total > 0
            ? `${num(total)} أوردر${status || payment || search ? ' بالفلتر الحالي' : ''}`
            : 'مافيش أوردرات لسه'
        }
      >
        <a href={exportHref} className="btn-ghost">
          نزّل Excel
        </a>
      </PageHead>

      {/* ── الفلاتر ── */}
      <Panel className="mb-5">
        {/* GET form — بتشتغل من غير جافاسكريبت خالص */}
        <form method="get" action="/admin/orders" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[13rem] flex-1">
            <label htmlFor="o-q" className="label">بحث</label>
            <input
              id="o-q"
              name="q"
              defaultValue={search}
              className="field"
              placeholder="رقم الأوردر أو الموبايل أو الاسم"
            />
          </div>

          <div>
            <label htmlFor="o-status" className="label">الحالة</label>
            <select id="o-status" name="status" defaultValue={status} className="field">
              <option value="">كل الحالات</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{ORDER_STATUS[s]}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="o-payment" className="label">الدفع</label>
            <select id="o-payment" name="payment" defaultValue={payment} className="field">
              <option value="">كل حالات الدفع</option>
              {PAY_STATUSES.map((s) => (
                <option key={s} value={s}>{PAYMENT_STATUS[s]}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-solid">فلتر</button>

          {status || payment || search ? (
            <Link href="/admin/orders" className="btn-quiet">صفّر</Link>
          ) : null}
        </form>

        {/* اختصارات سريعة */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-hair-soft pt-4">
          <Link href="/admin/orders" className="chip" data-on={!status && !payment ? '1' : '0'}>
            الكل
          </Link>
          <Link
            href="/admin/orders?status=new"
            className="chip"
            data-on={status === 'new' ? '1' : '0'}
          >
            جديد
          </Link>
          <Link
            href="/admin/orders?payment=pending_review"
            className="chip"
            data-on={payment === 'pending_review' ? '1' : '0'}
          >
            تحويل مستنّي مراجعة
          </Link>
          <Link
            href="/admin/orders?status=shipped"
            className="chip"
            data-on={status === 'shipped' ? '1' : '0'}
          >
            في الشحن
          </Link>
        </div>
      </Panel>

      {/* ── الجدول ── */}
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
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>الأوردر</th>
                  <th>العميل</th>
                  <th>المحافظة</th>
                  <th className="text-end">الإجمالي</th>
                  <th>الدفع</th>
                  <th>الحالة</th>
                  <th className="text-end">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="num font-mark text-brass underline underline-offset-4"
                        dir="ltr"
                      >
                        {o.order_no}
                      </Link>
                      <span className="num mt-0.5 block text-xs2 text-ink-42">
                        {num(o.items_count)} قطعة
                      </span>
                    </td>

                    <td>
                      <span className="block">{o.customer_name}</span>
                      <span className="num block text-xs2 text-ink-42" dir="ltr">
                        {o.phone}
                      </span>
                    </td>

                    <td>
                      <span className="block">{o.governorate}</span>
                      <span className="block text-xs2 text-ink-42">{o.area}</span>
                    </td>

                    <td className="num text-end">{egp(o.total)}</td>

                    <td>
                      <span className="block text-xs2">
                        {PAYMENT_METHOD_SHORT[o.payment_method] || o.payment_method}
                      </span>
                      <span
                        className={`chip mt-1 ${PAYMENT_STATUS_STYLE[o.payment_status] || ''}`}
                      >
                        {PAYMENT_STATUS[o.payment_status]}
                      </span>
                    </td>

                    <td>
                      <span className={`chip ${STATUS_STYLE[o.status] || ''}`}>
                        {ORDER_STATUS[o.status]}
                      </span>
                    </td>

                    <td className="num text-end text-xs2 text-ink-60">
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
          <div className="mt-5 flex items-center justify-between border-t border-hair-soft pt-4">
            {page > 1 ? (
              <Link href={href({ page: page - 1 })} className="btn-ghost">
                الأحدث
              </Link>
            ) : (
              <span />
            )}

            <span className="num text-xs2 text-ink-60">
              صفحة {num(page)} من {num(pages)}
            </span>

            {page < pages ? (
              <Link href={href({ page: page + 1 })} className="btn-ghost">
                الأقدم
              </Link>
            ) : (
              <span />
            )}
          </div>
        ) : null}
      </Panel>
    </>
  );
}
