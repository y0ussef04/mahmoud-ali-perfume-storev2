import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-guard';
import { Mark } from '@/components/Logo';
import PrintButton from '@/components/admin/PrintButton';
import { dateTimeAr, egp, num } from '@/lib/money';
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '@/lib/labels';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = {
  title: 'فاتورة',
  robots: { index: false, follow: false },
};

export default async function InvoicePage({ params }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  if (!UUID.test(id)) notFound();

  const [{ data: order }, { data: settingRows }] = await Promise.all([
    supabase.from('orders').select('*, order_items ( * )').eq('id', id).maybeSingle(),
    supabase.from('settings').select('key, value'),
  ]);

  if (!order) notFound();

  const s = Object.fromEntries((settingRows || []).map((r) => [r.key, r.value]));
  const storeName = s.store_name || "Mahmoud-Ali's store";
  const waNumber = s.wa_number || '';

  const isCod = order.payment_method === 'cod';
  // المطلوب تحصيله: دفع عند الاستلام + لسه مادُفعش + مش ملغي/مرتجع.
  // لازم يستبعد الملغي عشان مايتطبعش "حصّل كذا" على وصل أوردر متلغي.
  const collectable = ['cancelled', 'returned'].includes(order.status)
    ? false
    : isCod && order.payment_status === 'unpaid';
  const due = collectable ? Number(order.total) : 0;

  return (
    <>
      {/* ── شريط الأدوات — مايتطبعش ── */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/orders/${order.id}`} className="btn-quiet">
          ← رجوع للأوردر
        </Link>
        <PrintButton />
      </div>

      <p className="no-print mb-6 max-w-prose text-xs2 leading-relaxed text-ink-60">
        الورقة دي مقاس A5 — تنفع فاتورة للعميل وبوليصة للمندوب في نفس الوقت.
        في نافذة الطباعة اختار A5 وشيل علامة «الترويسة والتذييل» عشان الشكل يطلع
        نظيف.
      </p>

      {/* ── الورقة ── */}
      <article className="print-sheet mx-auto max-w-[148mm] border border-hair bg-white p-6">
        {/* الترويسة */}
        <header className="flex items-start justify-between gap-4 border-b border-oud pb-4">
          <div className="flex items-center gap-3">
            <Mark size={40} />
            <div>
              <p className="font-display text-d1 leading-tight">{storeName}</p>
              <p className="mt-0.5 text-xs2 text-ink-60">
                عطور إماراتية وسعودية أصلية
              </p>
              {waNumber ? (
                <p className="num mt-0.5 text-xs2 text-ink-60" dir="ltr">
                  +{waNumber}
                </p>
              ) : null}
            </div>
          </div>

          <div className="text-end">
            <p className="text-xs2 tracking-wide2 text-ink-42">أوردر</p>
            <p className="num font-mark text-d2 leading-tight" dir="ltr">
              {order.order_no}
            </p>
            <p className="mt-1 text-xs2 text-ink-60">{dateTimeAr(order.created_at)}</p>
          </div>
        </header>

        {/* المستلم */}
        <section className="grid gap-4 border-b border-hair-soft py-4 sm:grid-cols-2">
          <div>
            <p className="text-xs2 tracking-wide2 text-ink-42">المستلم</p>
            <p className="mt-1 text-xs1 font-medium">{order.customer_name}</p>
            <p className="num mt-0.5 text-xs1" dir="ltr">
              {order.phone}
              {order.phone2 ? ` / ${order.phone2}` : ''}
            </p>
          </div>

          <div>
            <p className="text-xs2 tracking-wide2 text-ink-42">العنوان</p>
            <p className="mt-1 text-xs1 leading-relaxed">
              {order.governorate} — {order.area}
              <br />
              {order.street}
              {order.landmark ? (
                <>
                  <br />
                  <span className="text-ink-60">علامة مميزة: {order.landmark}</span>
                </>
              ) : null}
            </p>
          </div>
        </section>

        {/* البنود */}
        <section className="py-4">
          <table className="w-full text-xs1">
            <thead>
              <tr className="border-b border-oud text-start">
                <th className="pb-2 text-start font-normal text-xs2 tracking-wide2 text-ink-42">
                  العطر
                </th>
                <th className="pb-2 text-start font-normal text-xs2 tracking-wide2 text-ink-42">
                  الحجم
                </th>
                <th className="pb-2 text-end font-normal text-xs2 tracking-wide2 text-ink-42">
                  ×
                </th>
                <th className="pb-2 text-end font-normal text-xs2 tracking-wide2 text-ink-42">
                  السعر
                </th>
                <th className="pb-2 text-end font-normal text-xs2 tracking-wide2 text-ink-42">
                  الإجمالي
                </th>
              </tr>
            </thead>
            <tbody>
              {(order.order_items || []).map((l) => (
                <tr key={l.id} className="border-b border-hair-soft align-top">
                  <td className="py-2">
                    {l.product_name}
                    {l.brand_name ? (
                      <span className="block text-xs2 text-ink-42">{l.brand_name}</span>
                    ) : null}
                  </td>
                  <td className="py-2">{l.variant_label}</td>
                  <td className="num py-2 text-end">{num(l.qty)}</td>
                  <td className="num py-2 text-end">{egp(l.unit_price)}</td>
                  <td className="num py-2 text-end">{egp(l.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* الحساب */}
        <section className="flex justify-end">
          <dl className="w-full max-w-[62mm] space-y-1.5 text-xs1">
            <Row label="المجموع" value={egp(order.subtotal)} />
            {Number(order.discount) > 0 ? (
              <Row
                label={order.coupon_code ? `خصم (${order.coupon_code})` : 'خصم'}
                value={`− ${egp(order.discount)}`}
              />
            ) : null}
            <Row
              label="الشحن"
              value={Number(order.shipping_fee) > 0 ? egp(order.shipping_fee) : 'مجاني'}
            />
            {Number(order.cod_fee) > 0 ? (
              <Row label="رسم التحصيل" value={egp(order.cod_fee)} />
            ) : null}
            <div className="flex items-baseline justify-between border-t border-oud pt-2">
              <dt className="font-display text-d1">الإجمالي</dt>
              <dd className="num font-display text-d1">{egp(order.total)}</dd>
            </div>
          </dl>
        </section>

        {/* المطلوب من المندوب */}
        <section className="mt-4 border border-oud p-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs2 tracking-wide2 text-ink-42">
              {due > 0 ? 'المطلوب تحصيله من العميل' : 'الدفع'}
            </p>
            <p className="num font-display text-d2">
              {due > 0 ? egp(due) : 'مدفوع مقدّم'}
            </p>
          </div>
          <p className="mt-1.5 text-xs2 leading-relaxed text-ink-60">
            {PAYMENT_METHOD[order.payment_method]} · {PAYMENT_STATUS[order.payment_status]}
            {' · '}
            حالة الأوردر: {ORDER_STATUS[order.status]}
            {order.transfer_ref ? (
              <>
                {' · '}
                رقم العملية: <span className="num font-mark">{order.transfer_ref}</span>
              </>
            ) : null}
          </p>
          {due === 0 ? (
            <p className="mt-1.5 text-xs2 font-medium text-oud">
              مامطلوب أي مبلغ من العميل — الأوردر مدفوع.
            </p>
          ) : null}
        </section>

        {/* ملاحظة العميل */}
        {order.note ? (
          <section className="mt-3 border-s-2 border-oud ps-3">
            <p className="text-xs2 tracking-wide2 text-ink-42">ملاحظة العميل</p>
            <p className="mt-0.5 text-xs2 leading-relaxed">{order.note}</p>
          </section>
        ) : null}

        {/* التذييل */}
        <footer className="mt-5 border-t border-hair-soft pt-3 text-xs2 leading-relaxed text-ink-60">
          <p>
            الاستبدال في ٧ أيام من الاستلام بشرط إن العطر مافتحش وبنفس الفاتورة.
            لأي استفسار كلّمنا على واتساب.
          </p>
          <p className="mt-1.5 text-ink-42">
            شكراً لثقتك — {storeName}
            {order.items_count
              ? ` · ${num(order.items_count)} قطعة في الأوردر ده`
              : ''}
          </p>
        </footer>
      </article>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-60">{label}</dt>
      <dd className="num">{value}</dd>
    </div>
  );
}
