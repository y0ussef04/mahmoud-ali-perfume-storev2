'use client';

import { useState } from 'react';
import { egp, dateTimeAr } from '@/lib/money';
import {
  ORDER_STATUS,
  STATUS_STYLE,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  PAYMENT_STATUS_STYLE,
} from '@/lib/labels';
import { normalizePhone } from '@/lib/validate';

import AnimateIn from '@/components/AnimateIn';
import { PackageSearch } from 'lucide-react';

/** المسار الطبيعي للأوردر — الإلغاء والمرتجع بره المسار */
const TRACK = ['new', 'confirmed', 'packed', 'shipped', 'delivered'];

const STEP_HINT = {
  new: 'تم استلام الطلب وجاري مراجعته',
  confirmed: 'تم تأكيد الطلب وجاري تجهيزه',
  packed: 'تم تغليف الشحنة وهي جاهزة للشحن',
  shipped: 'الشحنة مع شركة الشحن في الطريق إليك',
  delivered: 'تم تسليم الشحنة بنجاح',
};

export default function TrackOrder() {
  const [orderNo, setOrderNo] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setOrder(null);

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_no: orderNo.trim().toUpperCase(),
          phone: normalizePhone(phone),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setError(data?.error || 'لم نتمكن من العثور على الطلب. يرجى التأكد من البيانات.');
      } else {
        setOrder(data.order);
      }
    } catch {
      setError('حدث تعذر في الاتصال. يرجى المحاولة مرة أخرى.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <AnimateIn direction="down" className="text-center">
        <p className="text-xs2 tracking-wide3 text-[#C9A84C]">تتبع الشحنة</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-[#1A1814] dark:text-white">تتبع حالة الطلب</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6B6760] dark:text-[#A09C94]">
          أدخل رقم الطلب ورقم الهاتف المسجل لديك لمتابعة حالة شحنتك فوراً بدون الحاجة لتسجيل حساب.
        </p>
      </AnimateIn>

      <AnimateIn direction="up" delay={0.2}>
        <form onSubmit={submit} className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl mt-9 grid gap-5 p-6 sm:grid-cols-2 sm:p-8 shadow-sm">
          <div>
            <label htmlFor="t-order" className="block text-xs font-semibold text-[#6B6760] dark:text-[#A09C94] mb-1.5">رقم الطلب</label>
            <input
              id="t-order"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value.toUpperCase())}
              dir="ltr"
              required
              minLength={5}
              pattern="[A-Za-z0-9-]+"
              className="w-full bg-[#FAFAF8] dark:bg-[#111009] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-lg px-4 py-2.5 text-sm text-[#1A1814] dark:text-white placeholder-[#6B6760] focus:outline-none focus:border-[#C9A84C] min-h-[44px] num text-start"
              placeholder="MA-260909-0001"
            />
          </div>

          <div>
            <label htmlFor="t-phone" className="block text-xs font-semibold text-[#6B6760] dark:text-[#A09C94] mb-1.5">رقم الهاتف</label>
            <input
              id="t-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
              inputMode="numeric"
              required
              pattern="^01[0125][0-9]{8}$"
              maxLength={11}
              className="w-full bg-[#FAFAF8] dark:bg-[#111009] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-lg px-4 py-2.5 text-sm text-[#1A1814] dark:text-white placeholder-[#6B6760] focus:outline-none focus:border-[#C9A84C] min-h-[44px] num text-start"
              placeholder="01xxxxxxxxx"
            />
          </div>

          <div className="sm:col-span-2 pt-2">
            <button type="submit" disabled={busy} className="group/btn relative overflow-hidden w-full bg-gradient-to-r from-[#1A1814] to-[#2D2921] dark:from-[#C9A84C] dark:to-[#8B6914] text-white text-sm font-semibold py-3.5 rounded-full transition-all duration-300 active:scale-[0.97] min-h-[44px] flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-[#C9A84C]/20">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              <div className="relative z-10 flex items-center gap-2">
                <PackageSearch className="w-4 h-4" strokeWidth={1.5} />
                <span>{busy ? 'جاري البحث…' : 'عرض تفاصيل الطلب'}</span>
              </div>
            </button>
          </div>

          {error ? (
            <p
              role="alert"
              className="sm:col-span-2 rounded-lg border border-[#9B1C1C]/20 bg-[#9B1C1C]/5 px-4 py-3 text-sm text-[#9B1C1C]"
            >
              {error}
            </p>
          ) : null}
        </form>
      </AnimateIn>

      {order ? <OrderView order={order} /> : null}
    </div>
  );
}

function OrderView({ order }) {
  const cancelled = order.status === 'cancelled';
  const returned = order.status === 'returned';
  const offTrack = cancelled || returned;
  const reached = TRACK.indexOf(order.status);

  return (
    <section className="surface mt-8 p-6 sm:p-8">
      {/* العنوان */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="num font-mark text-d2" dir="ltr">
            {order.order_no}
          </p>
          <p className="mt-1 text-xs2 text-ink-42">
            تم التنسيق في {dateTimeAr(order.created_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`chip ${STATUS_STYLE[order.status] || ''}`}>
            {ORDER_STATUS[order.status] || order.status}
          </span>
          <span className={`chip ${PAYMENT_STATUS_STYLE[order.payment_status] || ''}`}>
            {PAYMENT_STATUS[order.payment_status] || order.payment_status}
          </span>
        </div>
      </div>

      <div className="rule my-7" />

      {/* المسار */}
      {offTrack ? (
        <p
          className={`border px-4 py-3.5 text-xs1 ${
            cancelled
              ? 'border-garnet bg-garnet/8 text-garnet'
              : 'border-hair bg-brass/8 text-brass'
          }`}
        >
          {cancelled
            ? 'هذا الطلب تم إلغاؤه. للتواصل أو الاستفسار يرجى التواصل معنا عبر واتساب.'
            : 'هذا الطلب مرتجع. للتواصل أو الاستفسار يرجى التواصل معنا عبر واتساب.'}
        </p>
      ) : (
        <ol className="space-y-0">
          {TRACK.map((s, i) => {
            const passed = i <= reached;
            const current = i === reached;
            const last = i === TRACK.length - 1;

            return (
              <li key={s} className="flex gap-4">
                {/* العمود الرأسي */}
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden="true"
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rotate-45 ${
                      current
                        ? 'bg-brass ring-4 ring-brass/20'
                        : passed
                          ? 'bg-brass'
                          : 'bg-hair-soft'
                    }`}
                  />
                  {last ? null : (
                    <span
                      aria-hidden="true"
                      className={`w-px flex-1 ${passed && i < reached ? 'bg-brass/50' : 'bg-hair-soft'}`}
                    />
                  )}
                </div>

                {/* النص */}
                <div className={`pb-6 ${last ? 'pb-0' : ''}`}>
                  <p
                    className={`text-xs1 ${
                      current
                        ? 'font-display text-d1 text-oud'
                        : passed
                          ? 'text-oud'
                          : 'text-ink-42'
                    }`}
                  >
                    {ORDER_STATUS[s]}
                  </p>
                  <p className="mt-0.5 text-xs2 text-ink-60">{STEP_HINT[s]}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="rule my-7" />

      {/* البنود */}
      <h2 className="font-display text-d1">البنود</h2>
      <ul className="mt-3 divide-y divide-hair-soft">
        {(order.order_items || []).map((l, i) => (
          <li key={i} className="flex gap-3 py-3 text-xs1">
            <span className="num shrink-0 text-ink-42">{l.qty}×</span>
            <span className="min-w-0 flex-1">
              <span className="block">{l.product_name}</span>
              <span className="block text-xs2 text-ink-42">
                {l.brand_name} · {l.variant_label}
              </span>
            </span>
            <span className="num shrink-0">{egp(l.line_total)}</span>
          </li>
        ))}
      </ul>

      {/* الحسابات */}
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
          tone={Number(order.shipping_fee) > 0 ? undefined : 'sage'}
        />
        {Number(order.cod_fee) > 0 ? (
          <Row label="رسم التحصيل" value={egp(order.cod_fee)} />
        ) : null}
        <div className="flex items-baseline justify-between border-t border-hair pt-3">
          <dt className="font-display text-d1">الإجمالي</dt>
          <dd className="num font-display text-d2">{egp(order.total)}</dd>
        </div>
      </dl>

      <p className="mt-6 text-xs2 leading-relaxed text-ink-60">
        الشحن لـ {order.governorate} — {order.area} · الدفع{' '}
        {PAYMENT_METHOD[order.payment_method] || order.payment_method}
      </p>
    </section>
  );
}

function Row({ label, value, tone }) {
  const color = tone === 'sage' ? 'text-sage' : 'text-oud';
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-ink-60">{label}</dt>
      <dd className={`num ${color}`}>{value}</dd>
    </div>
  );
}
