import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-guard';
import CopyBox from '@/components/admin/CopyBox';
import OrderControls from '@/components/admin/OrderControls';
import { Panel } from '@/components/admin/ui';
import { dateTimeAr, egp, num } from '@/lib/money';
import {
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  PAYMENT_STATUS_STYLE,
  STATUS_STYLE,
} from '@/lib/labels';
import AnimateIn from '@/components/AnimateIn';
import { ArrowRight, Printer, Phone, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: UUID.test(id) ? 'أوردر' : 'غير موجود' };
}

export default async function OrderPage({ params }) {
  await requireAdmin();
  const { id } = await params;

  if (!UUID.test(id)) notFound();

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data: order } = await adminClient
    .from('orders')
    .select('*, order_items ( * )')
    .eq('id', id)
    .maybeSingle();

  if (!order) notFound();

  // الإيصال في باكِت خاص — بنعمل رابط مؤقّت بيقفل بعد ١٠ دقايق
  let receiptLink = null;
  if (order.receipt_url) {
    const { data: signed } = await adminClient.storage
      .from('receipts')
      .createSignedUrl(order.receipt_url, 600);
    receiptLink = signed?.signedUrl || null;
  }

  const courierText = [
    order.customer_name,
    order.phone + (order.phone2 ? ` / ${order.phone2}` : ''),
    `${order.governorate} — ${order.area}`,
    order.street,
    order.landmark ? `علامة مميزة: ${order.landmark}` : null,
    order.payment_method === 'cod'
      ? `تحصيل: ${order.total} ج.م`
      : `مدفوع مقدّم — مافيش تحصيل`,
    `أوردر: ${order.order_no}`,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <AnimateIn className="space-y-6">
      {/* ── الرأس ── */}
      <header>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#736B5E] dark:text-[#A8A296] hover:text-[#C9A84C] transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>كل الأوردرات</span>
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="num font-mark text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1814] dark:text-[#F5F2EB]" dir="ltr">
              {order.order_no}
            </h1>
            <p className="mt-1.5 text-xs text-[#736B5E] dark:text-[#A8A296]">
              تم التسجيل {dateTimeAr(order.created_at)}
              {order.updated_at && order.updated_at !== order.created_at
                ? ` · آخر تحديث ${dateTimeAr(order.updated_at)}`
                : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`chip ${STATUS_STYLE[order.status] || ''}`}>
              {ORDER_STATUS[order.status]}
            </span>
            <span className={`chip ${PAYMENT_STATUS_STYLE[order.payment_status] || ''}`}>
              {PAYMENT_STATUS[order.payment_status]}
            </span>
            <Link
              href={`/admin/orders/${order.id}/invoice`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#1A1814] px-4 py-1.5 text-xs font-semibold text-[#1A1814] dark:text-[#F5F2EB] shadow-sm hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all"
              prefetch={false}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الفاتورة</span>
            </Link>
          </div>
        </div>

        {order.status === 'cancelled' && order.cancel_reason ? (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-700 dark:text-rose-400">
            سبب الإلغاء: {order.cancel_reason}
          </div>
        ) : null}
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        {/* ══ العمود الأول ══ */}
        <div className="space-y-5">
          {/* البنود */}
          <Panel title="البنود" hint="الأسماء والأسعار محفوظة من وقت الأوردر">
            <div className="overflow-x-auto rounded-xl border border-[#E8E6E1] dark:border-[#2E2B22]">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>العطر</th>
                    <th className="w-28 text-start">الحجم</th>
                    <th className="w-28 text-end">السعر</th>
                    <th className="w-20 text-center">الكمية</th>
                    <th className="w-32 text-end">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.order_items || []).map((l) => (
                    <tr key={l.id}>
                      <td>
                        <span className="block font-medium">{l.product_name}</span>
                        <span className="block text-xs2 text-ink-42">
                          {l.brand_name || '—'}
                        </span>
                      </td>
                      <td className="w-28 text-xs text-[#736B5E] dark:text-[#A8A296]">{l.variant_label || 'الأساسي'}</td>
                      <td className="num w-28 text-end">{egp(l.unit_price)}</td>
                      <td className="num w-20 text-center">{num(l.qty)}</td>
                      <td className="num w-32 text-end font-semibold text-[#C9A84C]">{egp(l.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="mt-5 space-y-2.5 border-t border-hair-soft pt-5 text-xs1">
              <Row label="المجموع" value={egp(order.subtotal)} />
              {Number(order.discount) > 0 ? (
                <Row
                  label={order.coupon_code ? `الخصم (${order.coupon_code})` : 'الخصم'}
                  value={`− ${egp(order.discount)}`}
                  tone="sage"
                />
              ) : null}
              <Row
                label="الشحن"
                value={Number(order.shipping_fee) > 0 ? egp(order.shipping_fee) : 'مجاني'}
              />
              {Number(order.cod_fee) > 0 ? (
                <Row label="رسم التحصيل" value={egp(order.cod_fee)} />
              ) : null}
              <div className="flex items-baseline justify-between border-t border-hair pt-3">
                <dt className="font-display text-d1">الإجمالي</dt>
                <dd className="num font-display text-d2">{egp(order.total)}</dd>
              </div>
            </dl>
          </Panel>

          {/* العميل */}
          <Panel title="العميل والعنوان" hint="جاهز للنسخ لشركة الشحن">
            <CopyBox text={courierText} label="انسخ البيانات" />

            {order.note ? (
              <div className="mt-4 border-s-2 border-brass ps-4">
                <p className="text-xs2 tracking-wide2 text-ink-60">ملاحظة العميل</p>
                <p className="mt-1 text-xs1 leading-relaxed">{order.note}</p>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`tel:${order.phone}`} className="btn-ghost">
                اتصل
              </a>
              {order.phone2 ? (
                <a href={`tel:${order.phone2}`} className="btn-ghost">
                  الرقم الاحتياطي
                </a>
              ) : null}
            </div>
          </Panel>

          {/* التحويل */}
          {order.payment_method === 'wallet' ? (
            <Panel title="التحويل" hint="راجع الإيصال قبل ما تأكّد الدفع">
              <dl className="space-y-2.5 text-xs1">
                <Row label="طريقة الدفع" value={PAYMENT_METHOD[order.payment_method]} />
                <Row
                  label="رقم العملية"
                  value={
                    <span className="num font-mark" dir="ltr">
                      {order.transfer_ref || '—'}
                    </span>
                  }
                />
              </dl>

              {receiptLink ? (
                <a
                  href={receiptLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-solid mt-4"
                >
                  افتح صورة الإيصال
                </a>
              ) : (
                <p className="mt-4 text-xs1 text-ink-42">
                  مافيش إيصال مرفوع مع الأوردر ده.
                </p>
              )}

              <p className="mt-3 text-xs2 leading-relaxed text-ink-42">
                الرابط ده مؤقّت وبيقفل بعد ١٠ دقايق — الإيصالات مخزّنة في مكان
                خاص، مش مكشوفة للناس.
              </p>
            </Panel>
          ) : null}
        </div>

        {/* ══ العمود التاني ══ */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          <Panel title="الإجراءات">
            <OrderControls order={order} />
          </Panel>
        </div>
      </div>
    </AnimateIn>
  );
}

function Row({ label, value, tone }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-60">{label}</dt>
      <dd className={`num ${tone === 'sage' ? 'text-sage' : 'text-oud'}`}>{value}</dd>
    </div>
  );
}
