'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/lib/cart';
import { createClient } from '@/lib/supabase/client';
import { computeTotals, settingNum } from '@/lib/totals';
import { egp, num } from '@/lib/money';
import { PAYMENT_METHOD } from '@/lib/labels';
import {
  checkReceiptFile,
  normalizePhone,
  validateShipping,
  validateTransfer,
} from '@/lib/validate';

const STEPS = ['الشحن', 'الدفع', 'المراجعة'];

export default function Checkout({ rates, settings }) {
  const { items, subtotal, payload, clear } = useCart();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    phone2: '',
    governorate: '',
    area: '',
    street: '',
    landmark: '',
    note: '',
  });
  const [method, setMethod] = useState('cod');
  const [transferRef, setTransferRef] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [errors, setErrors] = useState({});

  // الكوبون
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);

  // الإرسال
  const [busy, setBusy] = useState(false);
  const [fatal, setFatal] = useState('');
  const [done, setDone] = useState(null);

  // settingNum مش `|| default` — الصفر قيمة مقصودة هنا،
  // وأي اختلاف بين الرقمين دول والداتابيز معناه إن العميل
  // يشوف مجموع ويتحاسب على غيره
  const threshold = settingNum(settings.free_ship_threshold, 1500);
  const codFee = settingNum(settings.cod_fee, 15);

  const rate = rates.find((r) => r.governorate === form.governorate) || null;

  const t = useMemo(
    () =>
      computeTotals({
        subtotal,
        baseFee: rate ? Number(rate.fee) : null,
        threshold,
        codFee,
        method,
        coupon,
      }),
    [subtotal, rate, threshold, codFee, method, coupon]
  );

  const set = (k) => (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  // ══════════════ الكوبون ══════════════
  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;

    setCouponBusy(true);
    setCouponMsg('');
    try {
      const res = await fetch('/api/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();

      if (data?.ok) {
        // at = المجموع اللي الخصم ده محسوب عليه. لازم نحفظه عشان
        // نعرف بعدين لو العربة اتغيّرت والخصم بقى قديم.
        setCoupon({ ...data, at: subtotal });
        setCouponMsg(
          data.free_ship
            ? 'تمام — الشحن بقى مجاني.'
            : `تمام — اتخصم ${egp(data.discount)}.`
        );
      } else {
        setCoupon(null);
        setCouponMsg(data?.error || 'الكود مش صالح.');
      }
    } catch {
      setCoupon(null);
      setCouponMsg('مشكلة في الاتصال. جرّب تاني.');
    } finally {
      setCouponBusy(false);
    }
  }

  /**
   * الخصم بايت لما العربة تتغيّر بعد تفعيل الكود.
   * الداتابيز بتعيد حساب الخصم على المجموع الجديد وقت التأكيد، فلو
   * سبنا الرقم القديم معروض، العميل يشوف مجموع ويتحاسب على غيره —
   * وفي حالة كود ليه حد أدنى، الأوردر بيترفض من السيرفر أصلاً.
   */
  const couponStale = Boolean(coupon) && coupon.at !== subtotal;

  useEffect(() => {
    if (!couponStale || done) return;

    let alive = true;
    // تأخير بسيط عشان تعديل الكمية بسرعة مايعملش طلبات كتير
    // (الـ API محدود ١٢ طلب في الدقيقة)
    const timer = setTimeout(async () => {
      setCouponBusy(true);
      try {
        const res = await fetch('/api/coupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: coupon.code, subtotal }),
        });
        const data = await res.json();
        if (!alive) return;

        if (data?.ok) {
          setCoupon({ ...data, at: subtotal });
          setCouponMsg(
            data.free_ship
              ? 'تمام — الشحن بقى مجاني.'
              : `تمام — اتخصم ${egp(data.discount)}.`
          );
        } else {
          setCoupon(null);
          setCouponMsg(data?.error || 'الكود مابقاش صالح بعد ما العربة اتغيّرت.');
        }
      } catch {
        if (!alive) return;
        // الشبكة وقعت — نشيل الخصم بدل ما نعرض رقم مش مضمون
        setCoupon(null);
        setCouponMsg('مقدرناش نتأكد من الكود بعد تعديل العربة. ضيفه تاني.');
      } finally {
        if (alive) setCouponBusy(false);
      }
    }, 450);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [couponStale, coupon, subtotal, done]);

  function dropCoupon() {
    setCoupon(null);
    setCouponInput('');
    setCouponMsg('');
  }

  // ══════════════ التنقّل بين الخطوات ══════════════
  function next() {
    if (step === 1) {
      const e = validateShipping(form);
      setErrors(e);
      if (Object.keys(e).length) {
        focusFirst(e);
        return;
      }
    }

    if (step === 2 && method === 'wallet') {
      const e = validateTransfer({ transferRef, receipt });
      setErrors(e);
      if (Object.keys(e).length) return;
    }

    setStep((s) => Math.min(3, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function back() {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function focusFirst(e) {
    const first = Object.keys(e)[0];
    document.getElementById(`f-${first}`)?.focus();
  }

  function pickReceipt(e) {
    const file = e.target.files?.[0] || null;
    if (!file) return setReceipt(null);

    const bad = checkReceiptFile(file);
    if (bad) {
      setErrors((x) => ({ ...x, receipt: bad }));
      setReceipt(null);
      e.target.value = '';
      return;
    }
    setErrors((x) => ({ ...x, receipt: undefined }));
    setReceipt(file);
  }

  // ══════════════ التأكيد ══════════════
  async function submit() {
    setBusy(true);
    setFatal('');

    try {
      // ① رفع الإيصال لو التحويل
      let receiptPath = null;
      if (method === 'wallet' && receipt) {
        const supabase = createClient();
        const ext =
          (receipt.name.split('.').pop() || 'jpg')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '') || 'jpg';
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('receipts')
          .upload(path, receipt, { contentType: receipt.type, upsert: false });

        if (upErr) throw new Error(`رفع الإيصال فشل: ${upErr.message}`);
        receiptPath = path;
      }

      // ② تسجيل الأوردر — الحساب النهائي بيحصل في الداتابيز
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            ...form,
            phone: normalizePhone(form.phone),
            phone2: form.phone2 ? normalizePhone(form.phone2) : '',
          },
          items: payload,
          payment_method: method,
          coupon_code: coupon?.code || null,
          transfer_ref: method === 'wallet' ? transferRef.trim() : null,
          receipt_url: receiptPath,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'الأوردر مانفعش يتسجّل.');
      }

      // صورة للعرض قبل ما نفرّغ العربة
      setDone({
        ...data,
        lines: items.map((l) => ({
          name: l.name,
          brandName: l.brandName,
          label: l.label,
          qty: l.qty,
          price: l.price,
        })),
        method,
      });
      clear();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setFatal(e.message || 'حصلت مشكلة. جرّب تاني.');
    } finally {
      setBusy(false);
    }
  }

  // ══════════════ شاشة النجاح ══════════════
  if (done) {
    return (
      <Done
        done={done}
        form={form}
        settings={settings}
        rate={rate}
      />
    );
  }

  // ══════════════ عربة فاضية ══════════════
  if (items.length === 0) {
    return (
      <div className="surface mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="font-display text-d3">العربة فاضية</h1>
        <p className="mt-3 text-xs1 text-ink-60">
          ضيف عطر من الكاتالوج الأول.
        </p>
        <Link href="/products" className="btn-solid mt-6">
          كل العطور
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr]">
      {/* ══════════════ العمود الأول: الخطوات ══════════════ */}
      <div>
        {/* شريط التقدّم */}
        <ol className="flex items-stretch border border-hair-soft">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const on = n === step;
            const passed = n < step;
            return (
              <li key={label} className="flex-1">
                <button
                  type="button"
                  onClick={() => passed && setStep(n)}
                  disabled={!passed}
                  aria-current={on ? 'step' : undefined}
                  className={`w-full px-3 py-3 text-xs2 tracking-wide2 transition-colors ${
                    on
                      ? 'bg-lacquer text-brass-gilt'
                      : passed
                        ? 'text-brass hover:bg-brass/10'
                        : 'text-ink-42'
                  }`}
                >
                  <span className="num">{n}</span>
                  <span className="ms-2">{label}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* ─── ① الشحن ─────────────────────────────────── */}
        {step === 1 ? (
          <section className="mt-7">
            <h2 className="font-display text-d2">بيانات الشحن</h2>
            <p className="mt-1.5 text-xs2 text-ink-60">
              مافيش تسجيل. رقم الموبايل هو اللي بنتابع بيه الأوردر.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="f-name" className="label">الاسم بالكامل</label>
                <input
                  id="f-name"
                  value={form.name}
                  onChange={set('name')}
                  aria-invalid={!!errors.name}
                  autoComplete="name"
                  className="field"
                  placeholder="محمود علي حسن"
                />
                {errors.name ? <span className="err">{errors.name}</span> : null}
              </div>

              <div>
                <label htmlFor="f-phone" className="label">الموبايل</label>
                <input
                  id="f-phone"
                  value={form.phone}
                  onChange={set('phone')}
                  aria-invalid={!!errors.phone}
                  inputMode="numeric"
                  autoComplete="tel"
                  dir="ltr"
                  className="field text-start"
                  placeholder="01xxxxxxxxx"
                />
                {errors.phone ? <span className="err">{errors.phone}</span> : null}
              </div>

              <div>
                <label htmlFor="f-phone2" className="label">
                  رقم احتياطي <span className="text-ink-42">(اختياري)</span>
                </label>
                <input
                  id="f-phone2"
                  value={form.phone2}
                  onChange={set('phone2')}
                  aria-invalid={!!errors.phone2}
                  inputMode="numeric"
                  dir="ltr"
                  className="field text-start"
                  placeholder="01xxxxxxxxx"
                />
                {errors.phone2 ? <span className="err">{errors.phone2}</span> : null}
              </div>

              <div>
                <label htmlFor="f-governorate" className="label">المحافظة</label>
                <select
                  id="f-governorate"
                  value={form.governorate}
                  onChange={set('governorate')}
                  aria-invalid={!!errors.governorate}
                  className="field"
                >
                  <option value="">اختار المحافظة</option>
                  {rates.map((r) => (
                    <option key={r.governorate} value={r.governorate}>
                      {r.governorate} — {num(r.fee)} ج.م
                    </option>
                  ))}
                </select>
                {errors.governorate ? (
                  <span className="err">{errors.governorate}</span>
                ) : rate ? (
                  <span className="num mt-1 block text-xs2 text-sage">
                    التوصيل {rate.days_min}–{rate.days_max} يوم عمل
                  </span>
                ) : null}
              </div>

              <div>
                <label htmlFor="f-area" className="label">المدينة أو الحي</label>
                <input
                  id="f-area"
                  value={form.area}
                  onChange={set('area')}
                  aria-invalid={!!errors.area}
                  className="field"
                  placeholder="مدينة نصر"
                />
                {errors.area ? <span className="err">{errors.area}</span> : null}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="f-street" className="label">
                  الشارع والعمارة والدور والشقة
                </label>
                <input
                  id="f-street"
                  value={form.street}
                  onChange={set('street')}
                  aria-invalid={!!errors.street}
                  autoComplete="street-address"
                  className="field"
                  placeholder="١٢ شارع مصطفى النحاس، عمارة ٤، الدور ٣، شقة ٧"
                />
                {errors.street ? <span className="err">{errors.street}</span> : null}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="f-landmark" className="label">
                  علامة مميزة <span className="text-ink-42">(بتسهّل على المندوب كتير)</span>
                </label>
                <input
                  id="f-landmark"
                  value={form.landmark}
                  onChange={set('landmark')}
                  className="field"
                  placeholder="جنب صيدلية العزبي، فوق كافيه"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="f-note" className="label">
                  ملاحظة للأوردر <span className="text-ink-42">(اختياري)</span>
                </label>
                <textarea
                  id="f-note"
                  value={form.note}
                  onChange={set('note')}
                  rows={2}
                  className="field"
                  placeholder="مثلاً: اتصل قبل ما تيجي، أو غلّفه هدية"
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* ─── ② الدفع ─────────────────────────────────── */}
        {step === 2 ? (
          <section className="mt-7">
            <h2 className="font-display text-d2">الدفع</h2>
            <p className="mt-1.5 text-xs2 text-ink-60">
              اختار اللي يريّحك. لو دفعت مقدّم رسم التحصيل بيتلغي.
            </p>

            <div className="mt-6 space-y-3">
              {/* عند الاستلام */}
              <PayOption
                value="cod"
                method={method}
                onPick={setMethod}
                title={PAYMENT_METHOD.cod}
                hint={`تدفع للمندوب لما يوصلك. رسم تحصيل ${egp(codFee)}.`}
              />

              {/* كارت */}
              <PayOption
                value="card"
                method={method}
                onPick={setMethod}
                title={PAYMENT_METHOD.card}
                hint="فيزا وماستركارد ومحافظ. بنبعتلك لينك الدفع على واتساب بعد التأكيد خلال دقائق."
              >
                <p className="text-xs2 leading-relaxed text-ink-60">
                  بنجهز لينك الدفع الأونلاين (Paymob). بعد التأكيد بنبعتلك لينك دفع
                  آمن على واتساب في دقايق، والأوردر بيتحجز باسمك لمدة ٢٤ ساعة.
                </p>
              </PayOption>

              {/* تحويل */}
              <PayOption
                value="wallet"
                method={method}
                onPick={setMethod}
                title={PAYMENT_METHOD.wallet}
                hint="حوّل المبلغ وارفع صورة الإيصال — بنراجعه ونأكّد في نفس اليوم."
              >
                <div className="space-y-4">
                  <div className="border border-hair bg-elevated px-4 py-3">
                    <p className="text-xs2 text-ink-60">حوّل على الرقم</p>
                    <p className="num mt-1 font-mark text-d2" dir="ltr">
                      {settings.wallet_number}
                    </p>
                    <p className="num mt-1 text-xs2 text-brass">
                      المبلغ: {t.shipping == null ? '— حدّد المحافظة الأول' : egp(t.total)}
                    </p>
                    {/* الرقم المُلزِم بيتحسب في الداتابيز وقت التأكيد.
                        بنقول للعميل ده بصراحة عشان لو اختلف يعرف يتصرّف. */}
                    <p className="mt-2 text-xs2 leading-relaxed text-ink-42">
                      الرقم النهائي بيظهر في صفحة التأكيد. لو اختلف عن اللي حوّلته
                      بنكلّمك على واتساب ونظبّط الفرق.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="f-transferRef" className="label">
                      رقم العملية أو المحفظة اللي حوّلت منها
                    </label>
                    <input
                      id="f-transferRef"
                      value={transferRef}
                      onChange={(e) => {
                        setTransferRef(e.target.value);
                        if (errors.transferRef)
                          setErrors((x) => ({ ...x, transferRef: undefined }));
                      }}
                      aria-invalid={!!errors.transferRef}
                      dir="ltr"
                      className="field text-start"
                      placeholder="آخر ٤ أرقام كفاية"
                    />
                    {errors.transferRef ? (
                      <span className="err">{errors.transferRef}</span>
                    ) : null}
                  </div>

                  <div>
                    <span className="label">صورة إيصال التحويل</span>
                    <label
                      className="flex cursor-pointer items-center justify-between gap-3
                                 border border-dashed border-hair bg-elevated px-4 py-3.5"
                    >
                      <span className="text-xs1 text-ink-60">
                        {receipt ? receipt.name : 'اختار صورة أو PDF (٥ ميجا أقصى حد)'}
                      </span>
                      <span className="btn-ghost shrink-0 px-3 py-1.5">تصفّح</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={pickReceipt}
                        className="sr-only"
                      />
                    </label>
                    {errors.receipt ? <span className="err">{errors.receipt}</span> : null}
                    {receipt ? (
                      <span className="num mt-1 block text-xs2 text-sage">
                        تم اختيار الملف — {(receipt.size / 1024 / 1024).toFixed(2)} ميجا
                      </span>
                    ) : null}
                  </div>
                </div>
              </PayOption>
            </div>
          </section>
        ) : null}

        {/* ─── ③ المراجعة ──────────────────────────────── */}
        {step === 3 ? (
          <section className="mt-7">
            <h2 className="font-display text-d2">راجع قبل التأكيد</h2>

            <dl className="mt-6 divide-y divide-hair-soft border border-hair-soft">
              <Row label="الاسم" value={form.name} onEdit={() => setStep(1)} />
              <Row
                label="الموبايل"
                value={
                  <span dir="ltr" className="num inline-block">
                    {normalizePhone(form.phone)}
                    {form.phone2 ? ` / ${normalizePhone(form.phone2)}` : ''}
                  </span>
                }
                onEdit={() => setStep(1)}
              />
              <Row
                label="العنوان"
                value={
                  <>
                    {form.governorate} — {form.area}
                    <br />
                    {form.street}
                    {form.landmark ? (
                      <>
                        <br />
                        <span className="text-ink-60">علامة مميزة: {form.landmark}</span>
                      </>
                    ) : null}
                  </>
                }
                onEdit={() => setStep(1)}
              />
              <Row
                label="الدفع"
                value={PAYMENT_METHOD[method]}
                onEdit={() => setStep(2)}
              />
              {form.note ? (
                <Row label="ملاحظة" value={form.note} onEdit={() => setStep(1)} />
              ) : null}
            </dl>

            {fatal ? (
              <p
                role="alert"
                className="mt-6 border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet"
              >
                {fatal}
              </p>
            ) : null}
          </section>
        ) : null}

        {/* ─── الأزرار ─────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {step > 1 ? (
            <button type="button" onClick={back} disabled={busy} className="btn-ghost">
              رجوع
            </button>
          ) : (
            <Link href="/products" className="btn-ghost">
              كمّل شراء
            </Link>
          )}

          {step < 3 ? (
            <button type="button" onClick={next} className="btn-solid ms-auto px-8">
              كمّل
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={busy || couponBusy || couponStale}
              className="btn-solid ms-auto px-8 py-3.5"
            >
              {busy
                ? 'بيتسجّل…'
                : couponBusy || couponStale
                  ? 'بنحدّث الخصم…'
                  : `أكّد الأوردر — ${egp(t.total)}`}
            </button>
          )}
        </div>
      </div>

      {/* ══════════════ العمود التاني: الملخّص ══════════════ */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="surface p-6">
          <h2 className="font-display text-d1">ملخّص الأوردر</h2>

          <ul className="mt-4 divide-y divide-hair-soft">
            {items.map((l) => (
              <li key={l.variantId} className="flex gap-3 py-3 text-xs1">
                <span className="num shrink-0 text-ink-42">{l.qty}×</span>
                <span className="min-w-0 flex-1">
                  <span className="block">{l.name}</span>
                  <span className="block text-xs2 text-ink-42">
                    {l.brandName} · {l.label}
                  </span>
                </span>
                <span className="num shrink-0">{egp(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>

          {/* الكوبون */}
          <div className="mt-5 border-t border-hair-soft pt-5">
            {coupon ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs1 text-sage">
                  كود <span className="font-mark">{coupon.code}</span> مفعّل
                </span>
                <button type="button" onClick={dropCoupon} className="btn-quiet">
                  شيل
                </button>
              </div>
            ) : (
              <>
                <label htmlFor="f-coupon" className="label">كود خصم</label>
                <div className="flex gap-2">
                  <input
                    id="f-coupon"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyCoupon();
                      }
                    }}
                    dir="ltr"
                    className="field text-start font-mark"
                    placeholder="WELCOME10"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponBusy || !couponInput.trim()}
                    className="btn-ghost shrink-0"
                  >
                    {couponBusy ? '…' : 'طبّق'}
                  </button>
                </div>
              </>
            )}
            {couponMsg ? (
              <p className={`mt-1.5 text-xs2 ${coupon ? 'text-sage' : 'text-garnet'}`}>
                {couponMsg}
              </p>
            ) : null}
          </div>

          {/* الحسابات */}
          <dl className="mt-5 space-y-2.5 border-t border-hair-soft pt-5 text-xs1">
            <Line label="المجموع" value={egp(t.subtotal)} />

            {t.discount > 0 ? (
              <Line label="الخصم" value={`− ${egp(t.discount)}`} tone="sage" />
            ) : null}

            <Line
              label="الشحن"
              value={
                t.shipping == null
                  ? 'حدّد المحافظة'
                  : t.freeShip
                    ? 'مجاني'
                    : egp(t.shipping)
              }
              tone={t.freeShip ? 'sage' : t.shipping == null ? 'muted' : undefined}
            />

            {t.cod > 0 ? <Line label="رسم التحصيل" value={egp(t.cod)} /> : null}

            <div className="flex items-baseline justify-between border-t border-hair pt-3">
              <dt className="font-display text-d1">الإجمالي</dt>
              <dd className="num font-display text-d2">{egp(t.total)}</dd>
            </div>
          </dl>

          {t.remainingForFreeShip != null && t.remainingForFreeShip > 0 ? (
            <p className="mt-4 border border-brass/40 bg-brass/8 px-3 py-2.5 text-xs2 text-brass">
              زوّد <span className="num">{egp(t.remainingForFreeShip)}</span> والشحن
              يبقى مجاني.
            </p>
          ) : null}

          <p className="mt-4 text-xs2 leading-relaxed text-ink-42">
            الأسعار بتتحسب في السيرفر وقت التأكيد، فأي فرق في الجدول ده هيتصحّح
            تلقائياً.
          </p>
        </div>
      </aside>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   قطع صغيرة
   ══════════════════════════════════════════════════════════ */

/** خيار دفع — الحقول الزيادة بره الـ label عشان الراديو مايتلخبطش */
function PayOption({ value, method, onPick, title, hint, children }) {
  const on = method === value;

  return (
    <div
      className={`border transition-colors ${
        on ? 'border-brass bg-brass/6' : 'border-hair-soft'
      }`}
    >
      <label className="flex cursor-pointer items-start gap-3 px-4 py-3.5">
        <input
          type="radio"
          name="pay"
          value={value}
          checked={on}
          onChange={() => onPick(value)}
          className="mt-1.5 accent-brass"
        />
        <span>
          <span className="block font-display text-d1">{title}</span>
          <span className="mt-0.5 block text-xs2 text-ink-60">{hint}</span>
        </span>
      </label>

      {on && children ? (
        <div className="border-t border-hair-soft px-4 py-4">{children}</div>
      ) : null}
    </div>
  );
}

function Line({ label, value, tone }) {
  const color =
    tone === 'sage' ? 'text-sage' : tone === 'muted' ? 'text-ink-42' : 'text-oud';
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-ink-60">{label}</dt>
      <dd className={`num ${color}`}>{value}</dd>
    </div>
  );
}

function Row({ label, value, onEdit }) {
  return (
    <div className="flex items-start gap-4 px-4 py-3.5">
      <dt className="w-24 shrink-0 text-xs2 tracking-wide2 text-ink-60">{label}</dt>
      <dd className="min-w-0 flex-1 text-xs1 leading-relaxed">{value}</dd>
      <button type="button" onClick={onEdit} className="btn-quiet shrink-0">
        عدّل
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   شاشة تم — وتسليم منظّم لواتساب
   ══════════════════════════════════════════════════════════ */
function Done({ done, form, settings, rate }) {
  const wa = settings.wa_number;

  const lines = done.lines
    .map((l) => `• ${l.name} (${l.brandName}) — ${l.label} × ${l.qty}`)
    .join('\n');

  const msg = [
    `أوردر رقم ${done.order_no}`,
    '',
    lines,
    '',
    `المجموع: ${done.subtotal} ج.م`,
    done.discount > 0 ? `الخصم: ${done.discount} ج.م` : null,
    `الشحن: ${done.shipping_fee > 0 ? `${done.shipping_fee} ج.م` : 'مجاني'}`,
    done.cod_fee > 0 ? `رسم التحصيل: ${done.cod_fee} ج.م` : null,
    `الإجمالي: ${done.total} ج.م`,
    '',
    `الاسم: ${form.name}`,
    `الموبايل: ${normalizePhone(form.phone)}`,
    `العنوان: ${form.governorate} — ${form.area}، ${form.street}`,
    form.landmark ? `علامة مميزة: ${form.landmark}` : null,
    `الدفع: ${PAYMENT_METHOD[done.method]}`,
  ]
    .filter(Boolean)
    .join('\n');

  const waHref = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(msg)}` : null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="surface px-6 py-10 text-center sm:px-10">
        <p className="text-xs2 tracking-wide3 text-brass">تم تسجيل الأوردر</p>

        <p className="num mt-4 font-mark text-d4" dir="ltr">
          {done.order_no}
        </p>

        <p className="mt-4 text-xs1 leading-relaxed text-ink-60">
          احفظ الرقم ده. تقدر تتابع الأوردر من صفحة{' '}
          <Link href="/track" className="text-brass underline underline-offset-4">
            تتبع أوردر
          </Link>{' '}
          برقم الأوردر ورقم موبايلك.
        </p>

        <div className="rule my-8" />

        <dl className="space-y-2.5 text-start text-xs1">
          <Line label="المجموع" value={egp(done.subtotal)} />
          {done.discount > 0 ? (
            <Line label="الخصم" value={`− ${egp(done.discount)}`} tone="sage" />
          ) : null}
          <Line
            label="الشحن"
            value={done.shipping_fee > 0 ? egp(done.shipping_fee) : 'مجاني'}
            tone={done.shipping_fee > 0 ? undefined : 'sage'}
          />
          {done.cod_fee > 0 ? (
            <Line label="رسم التحصيل" value={egp(done.cod_fee)} />
          ) : null}
          <div className="flex items-baseline justify-between border-t border-hair pt-3">
            <dt className="font-display text-d1">الإجمالي</dt>
            <dd className="num font-display text-d2">{egp(done.total)}</dd>
          </div>
        </dl>

        {rate ? (
          <p className="num mt-6 text-xs2 text-ink-60">
            التوصيل المتوقّع {rate.days_min}–{rate.days_max} يوم عمل لـ{' '}
            {form.governorate}.
          </p>
        ) : null}

        <div className="mt-8 space-y-3">
          {done.method === 'card' ? (
            <p className="border border-brass/40 bg-brass/8 px-4 py-3 text-xs1 text-brass">
              هنبعتلك لينك الدفع على واتساب في دقايق. الأوردر محجوز باسمك ٢٤ ساعة.
            </p>
          ) : null}

          {done.method === 'wallet' ? (
            <div className="border border-brass/40 bg-brass/8 px-4 py-3 text-xs1 text-brass">
              <p>استلمنا صورة التحويل. بنراجعها وبنأكّد الأوردر في نفس اليوم.</p>
              <p className="num mt-2">
                المبلغ المُعتمد على الأوردر ده: {egp(done.total)}
              </p>
              <p className="mt-1 leading-relaxed">
                لو المبلغ اللي حوّلته مختلف، ابعتلنا على واتساب برقم الأوردر
                وبنظبّطها.
              </p>
            </div>
          ) : null}

          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-solid w-full py-3.5"
            >
              ابعت تفاصيل الأوردر على واتساب
            </a>
          ) : null}

          <Link href="/products" className="btn-ghost w-full">
            كمّل شراء
          </Link>
        </div>
      </div>
    </div>
  );
}
