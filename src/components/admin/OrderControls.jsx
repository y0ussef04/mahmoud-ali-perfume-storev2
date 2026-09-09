'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ORDER_STATUS, PAYMENT_STATUS, STATUS_NEXT } from '@/lib/labels';
import { egp } from '@/lib/money';

/** 01012345678 → 201012345678 عشان wa.me */
function waNumber(phone) {
  const p = String(phone || '').replace(/\D/g, '');
  return p.startsWith('0') ? `2${p.slice(1)}` : p;
}

const NOTE_FOR = {
  confirmed: (o) => `تم تأكيد أوردرك رقم ${o.order_no} ✅ وبنجهّزه دلوقتي.`,
  packed: (o) => `أوردرك رقم ${o.order_no} اتغلّف وجاهز للشحن.`,
  shipped: (o) =>
    `أوردرك رقم ${o.order_no} خرج مع شركة الشحن. المبلغ المطلوب ${o.total} ج.م.`,
  delivered: (o) => `أوردرك رقم ${o.order_no} اتسلّم. بالهنا والشفا 🌿`,
  cancelled: (o) => `أوردرك رقم ${o.order_no} اتلغى. لو فيه أي استفسار كلّمنا.`,
};

export default function OrderControls({ order }) {
  const router = useRouter();

  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const [asking, setAsking] = useState(''); // الحالة اللي مستنية تأكيد
  const [reason, setReason] = useState('');

  const [note, setNote] = useState(order.admin_note || '');

  const next = STATUS_NEXT[order.status] || [];
  const isTransfer = order.payment_method === 'wallet';

  function reset(msg) {
    setError('');
    setOk(msg || '');
    setAsking('');
    setReason('');
    setBusy('');
  }

  async function setStatus(status, withReason) {
    setBusy(status);
    setError('');
    setOk('');

    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc('admin_set_status', {
        p_order_id: order.id,
        p_status: status,
        p_reason: withReason || null,
      });

      if (rpcError) throw new Error(rpcError.message);

      reset(
        data?.stock_restored
          ? `الحالة بقت "${ORDER_STATUS[status]}" والمخزون رجع مكانه.`
          : `الحالة بقت "${ORDER_STATUS[status]}".`
      );
      router.refresh();
    } catch (e) {
      setError(e.message || 'مانفعش يتغيّر.');
      setBusy('');
    }
  }

  async function setPayment(paymentStatus) {
    setBusy(`pay:${paymentStatus}`);
    setError('');
    setOk('');

    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc('admin_set_payment', {
        p_order_id: order.id,
        p_payment_status: paymentStatus,
      });

      if (rpcError) throw new Error(rpcError.message);

      reset(`حالة الدفع بقت "${PAYMENT_STATUS[paymentStatus]}".`);
      router.refresh();
    } catch (e) {
      setError(e.message || 'مانفعش يتغيّر.');
      setBusy('');
    }
  }

  async function saveNote() {
    setBusy('note');
    setError('');
    setOk('');

    try {
      const supabase = createClient();
      // RLS هي اللي بتسمح بده — سياسة orders_admin
      const { error: dbError } = await supabase
        .from('orders')
        .update({ admin_note: note.trim() || null })
        .eq('id', order.id);

      if (dbError) throw new Error(dbError.message);

      reset('الملاحظة اتسجّلت.');
      router.refresh();
    } catch (e) {
      setError(e.message || 'الملاحظة مانفعتش تتسجّل.');
      setBusy('');
    }
  }

  const waMsg = NOTE_FOR[order.status]?.({
    order_no: order.order_no,
    total: order.total,
  });

  return (
    <div className="space-y-6">
      {/* ── الرسايل ── */}
      {error ? (
        <p role="alert" className="border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="border border-sage bg-sage/8 px-4 py-3 text-xs1 text-sage">{ok}</p>
      ) : null}

      {/* ── الحالة ── */}
      <div>
        <h3 className="label">الخطوة الجاية</h3>

        {next.length === 0 ? (
          <p className="text-xs1 text-ink-42">
            الأوردر ده وصل لآخر حالة. مافيش خطوة بعد كده.
          </p>
        ) : asking ? (
          <div className="border border-garnet bg-garnet/6 p-4">
            <p className="text-xs1 text-oud">
              متأكد إنك عايز تحوّل الأوردر لـ{' '}
              <strong className="font-display">{ORDER_STATUS[asking]}</strong>؟
              {asking === 'cancelled' || asking === 'returned'
                ? ' المخزون هيرجع للأحجام تلقائياً.'
                : ''}
            </p>

            {asking === 'cancelled' ? (
              <div className="mt-3">
                <label htmlFor="o-reason" className="label">سبب الإلغاء</label>
                <input
                  id="o-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="field"
                  placeholder="العميل مردّش · الرقم غلط · طلب الإلغاء"
                />
              </div>
            ) : null}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setStatus(asking, reason)}
                disabled={!!busy || (asking === 'cancelled' && !reason.trim())}
                className="btn-solid"
              >
                {busy ? 'بيتنفّذ…' : 'أيوه، نفّذ'}
              </button>
              <button
                type="button"
                onClick={() => reset()}
                disabled={!!busy}
                className="btn-ghost"
              >
                رجوع
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {next.map((s) => {
              const danger = s === 'cancelled' || s === 'returned';
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAsking(s)}
                  disabled={!!busy}
                  className={danger ? 'btn-ghost' : 'btn-solid'}
                >
                  {ORDER_STATUS[s]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── الدفع ── */}
      <div className="border-t border-hair-soft pt-6">
        <h3 className="label">الدفع</h3>

        {isTransfer && order.payment_status === 'pending_review' ? (
          <p className="mb-3 border border-brass bg-brass/8 px-3 py-2.5 text-xs2 leading-relaxed text-brass">
            العميل حوّل ورفع إيصال. افتح الإيصال فوق واتأكّد إن المبلغ{' '}
            <span className="num">{egp(order.total)}</span> وصل، وبعدين أكّد الدفع.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {order.payment_status !== 'paid' ? (
            <button
              type="button"
              onClick={() => setPayment('paid')}
              disabled={!!busy}
              className="btn-solid"
            >
              {busy === 'pay:paid' ? 'بيتنفّذ…' : 'أكّد إن الدفع وصل'}
            </button>
          ) : null}

          {order.payment_status === 'paid' ? (
            <button
              type="button"
              onClick={() => setPayment('refunded')}
              disabled={!!busy}
              className="btn-ghost"
            >
              سجّل استرجاع
            </button>
          ) : null}

          {order.payment_status !== 'unpaid' && order.payment_status !== 'paid' ? (
            <button
              type="button"
              onClick={() => setPayment('unpaid')}
              disabled={!!busy}
              className="btn-ghost"
            >
              رجّعها «مش مدفوع»
            </button>
          ) : null}
        </div>
      </div>

      {/* ── واتساب ── */}
      {waMsg ? (
        <div className="border-t border-hair-soft pt-6">
          <h3 className="label">كلّم العميل</h3>
          <a
            href={`https://wa.me/${waNumber(order.phone)}?text=${encodeURIComponent(waMsg)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
          >
            ابعت تحديث الحالة على واتساب
          </a>
          <p className="mt-2 text-xs2 leading-relaxed text-ink-42">
            الرسالة مكتوبة جاهزة على حسب حالة الأوردر الحالية — تقدر تعدّلها قبل
            ما تبعتها.
          </p>
        </div>
      ) : null}

      {/* ── ملاحظة داخلية ── */}
      <div className="border-t border-hair-soft pt-6">
        <label htmlFor="o-note" className="label">
          ملاحظة داخلية <span className="text-ink-42">(العميل مش بيشوفها)</span>
        </label>
        <textarea
          id="o-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="field"
          placeholder="مثلاً: العميل طلب يتصلوا بيه بعد ٥ العصر"
        />
        <button
          type="button"
          onClick={saveNote}
          disabled={busy === 'note' || note === (order.admin_note || '')}
          className="btn-ghost mt-2"
        >
          {busy === 'note' ? 'بيتسجّل…' : 'سجّل الملاحظة'}
        </button>
      </div>
    </div>
  );
}
