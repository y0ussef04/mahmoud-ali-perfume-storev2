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

/** المسار الطبيعي للأوردر — الإلغاء والمرتجع بره المسار */
const TRACK = ['new', 'confirmed', 'packed', 'shipped', 'delivered'];

const STEP_HINT = {
  new: 'استلمنا الأوردر وبنراجعه',
  confirmed: 'أكّدنا معاك وبنجهّزه',
  packed: 'اتغلّف وجاهز للمندوب',
  shipped: 'مع شركة الشحن في السكة',
  delivered: 'وصلك — بالهنا والشفا',
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
        setError(data?.error || 'مالقيناش الأوردر.');
      } else {
        setOrder(data.order);
      }
    } catch {
      setError('مشكلة في الاتصال. جرّب تاني.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="text-center">
        <p className="text-xs2 tracking-wide3 text-brass">تتبع</p>
        <h1 className="mt-3 font-display text-d4">فين أوردرك</h1>
        <p className="mt-3 text-xs1 leading-relaxed text-ink-60">
          اكتب رقم الأوردر ورقم الموبايل اللي طلبت بيه. مافيش تسجيل ولا باسورد.
        </p>
      </header>

      <form onSubmit={submit} className="surface mt-9 grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <div>
          <label htmlFor="t-order" className="label">رقم الأوردر</label>
          <input
            id="t-order"
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value.toUpperCase())}
            dir="ltr"
            required
            className="field num text-start font-mark"
            placeholder="MA-260909-0001"
          />
        </div>

        <div>
          <label htmlFor="t-phone" className="label">الموبايل</label>
          <input
            id="t-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
            inputMode="numeric"
            required
            className="field text-start"
            placeholder="01xxxxxxxxx"
          />
        </div>

        <div className="sm:col-span-2">
          <button type="submit" disabled={busy} className="btn-solid w-full py-3.5">
            {busy ? 'بندوّر…' : 'اعرض الأوردر'}
          </button>
        </div>

        {error ? (
          <p
            role="alert"
            className="sm:col-span-2 border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet"
          >
            {error}
          </p>
        ) : null}
      </form>

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
            اتسجّل {dateTimeAr(order.created_at)}
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
            ? 'الأوردر ده اتلغى. لو ده مش صح كلّمنا على واتساب.'
            : 'الأوردر ده مرتجع. لو عندك استفسار كلّمنا على واتساب.'}
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
