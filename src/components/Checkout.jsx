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
import AnimateIn from '@/components/AnimateIn';
import {
  Check,
  CheckCircle2,
  Truck,
  CreditCard,
  Banknote,
  Wallet,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Copy,
  MessageCircle,
  Sparkles,
  ShoppingBag,
  Tag,
  Upload,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'بيانات التوصيل', icon: Truck },
  { id: 2, label: 'طريقة الدفع', icon: CreditCard },
  { id: 3, label: 'مراجعة الطلب', icon: CheckCircle2 },
];

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
        setCoupon({ ...data, at: subtotal });
        setCouponMsg(
          data.free_ship
            ? 'تم تطبيق الشحن المجاني بنجاح.'
            : `تم تطبيق الخصم بقيمة ${egp(data.discount)}.`
        );
      } else {
        setCoupon(null);
        setCouponMsg(data?.error || 'كود الخصم غير صحيح أو غير متاح.');
      }
    } catch {
      setCoupon(null);
      setCouponMsg('تعذر التحقق من كود الخصم حالياً.');
    } finally {
      setCouponBusy(false);
    }
  }

  function dropCoupon() {
    setCoupon(null);
    setCouponInput('');
    setCouponMsg('');
  }

  const couponStale = coupon && coupon.at !== subtotal;
  useEffect(() => {
    if (couponStale && !couponBusy) {
      applyCoupon();
    }
  }, [subtotal]);

  // ══════════════ الانتقال بين الخطوات ══════════════
  function next() {
    if (step === 1) {
      const v = validateShipping(form, rates);
      if (!v.ok) {
        setErrors(v.errors);
        window.scrollTo({ top: 100, behavior: 'smooth' });
        return;
      }
      setErrors({});
      setStep(2);
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    if (step === 2) {
      if (method === 'wallet') {
        const v = validateTransfer({ transferRef, receipt });
        if (!v.ok) {
          setErrors(v.errors);
          return;
        }
      }
      setErrors({});
      setStep(3);
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }
  }

  function back() {
    if (step > 1) {
      setStep((s) => s - 1);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    }
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
        throw new Error(data?.error || 'تعذر تسجيل الطلب، يرجى المحاولة مرة أخرى.');
      }

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
      setFatal(e.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
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
      <div className="rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#14120E] mx-auto max-w-lg p-8 sm:p-12 text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#C9A84C]/10 text-[#C9A84C] flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#1A1814] dark:text-white">سلة التسوق فارغة</h1>
        <p className="mt-2 text-xs sm:text-sm text-[#736B5E] dark:text-[#A8A296] leading-relaxed">
          لم تقم بإضافة أي عطور إلى السلة بعد. تصفّح تشكيلتنا المميزة من العطور الأصلية.
        </p>
        <Link
          href="/products"
          className="group/btn relative overflow-hidden inline-flex items-center justify-center gap-2 mt-6 px-7 py-3 rounded-full bg-gradient-to-r from-[#1A1814] to-[#2D2921] dark:from-[#C9A84C] dark:to-[#8B6914] text-white text-xs font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-[#C9A84C]/20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
          <span className="relative">استكشف العطور</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] items-start">
      {/* ══════════════ العمود الأول: الخطوات ══════════════ */}
      <AnimateIn direction="up" className="space-y-6">
        {/* شريط التقدّم الفاخر */}
        <div className="rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#14120E] p-3 sm:p-4 shadow-sm">
          <ol className="flex items-center justify-between gap-2">
            {STEPS.map((s, idx) => {
              const on = s.id === step;
              const passed = s.id < step;
              const Icon = s.icon;
              return (
                <li key={s.id} className="flex-1 flex items-center">
                  <button
                    type="button"
                    onClick={() => passed && setStep(s.id)}
                    disabled={!passed}
                    className={`flex items-center gap-2.5 w-full p-2 sm:p-2.5 rounded-xl transition-all duration-200 text-xs font-semibold ${
                      on
                        ? 'bg-[#C9A84C]/15 text-[#8B6914] dark:text-[#E8D9B3]'
                        : passed
                        ? 'text-[#C9A84C] hover:bg-[#C9A84C]/10 cursor-pointer'
                        : 'text-[#736B5E] dark:text-[#A8A296] opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                        on
                          ? 'bg-[#C9A84C] text-white shadow-sm shadow-[#C9A84C]/30'
                          : passed
                          ? 'bg-[#C9A84C]/20 text-[#C9A84C]'
                          : 'bg-black/5 dark:bg-white/5 text-[#736B5E] dark:text-[#A8A296]'
                      }`}
                    >
                      {passed ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : s.id}
                    </span>
                    <span className="truncate hidden sm:inline">{s.label}</span>
                  </button>
                  {idx < STEPS.length - 1 ? (
                    <div
                      className={`hidden md:block w-8 h-px mx-1 transition-colors ${
                        passed ? 'bg-[#C9A84C]' : 'bg-[#E8E6E1] dark:bg-[#2E2B22]'
                      }`}
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>

        {/* ─── ① الشحن ─────────────────────────────────── */}
        {step === 1 ? (
          <section className="rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#14120E] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-[#E8E6E1] dark:border-[#2E2B22] pb-4">
              <h2 className="text-xl font-semibold text-[#1A1814] dark:text-white">بيانات الشحن والتوصيل</h2>
              <p className="mt-1 text-xs text-[#736B5E] dark:text-[#A8A296]">
                بدون الحاجة لإنشاء حساب. رقم الهاتف هو المعتمد لمتابعة الشحنة وتأكيدها.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="f-name" className="label">الاسم بالكامل <span className="text-rose-500">*</span></label>
                <input
                  id="f-name"
                  value={form.name}
                  onChange={set('name')}
                  required
                  minLength={4}
                  aria-invalid={!!errors.name}
                  autoComplete="name"
                  className="field"
                  placeholder="محمود علي حسن"
                />
                {errors.name ? <span className="err">{errors.name}</span> : null}
              </div>

              <div>
                <label htmlFor="f-phone" className="label">رقم الموبايل <span className="text-rose-500">*</span></label>
                <input
                  id="f-phone"
                  value={form.phone}
                  onChange={set('phone')}
                  required
                  pattern="^01[0125][0-9]{8}$"
                  maxLength={11}
                  aria-invalid={!!errors.phone}
                  inputMode="numeric"
                  autoComplete="tel"
                  dir="ltr"
                  className="field text-start font-mono"
                  placeholder="01xxxxxxxxx"
                />
                {errors.phone ? <span className="err">{errors.phone}</span> : null}
              </div>

              <div>
                <label htmlFor="f-phone2" className="label">
                  رقم احتياطي <span className="text-xs text-[#736B5E] dark:text-[#A8A296] font-normal">(اختياري)</span>
                </label>
                <input
                  id="f-phone2"
                  value={form.phone2}
                  onChange={set('phone2')}
                  pattern="^01[0125][0-9]{8}$"
                  maxLength={11}
                  aria-invalid={!!errors.phone2}
                  inputMode="numeric"
                  dir="ltr"
                  className="field text-start font-mono"
                  placeholder="01xxxxxxxxx"
                />
                {errors.phone2 ? <span className="err">{errors.phone2}</span> : null}
              </div>

              <div>
                <label htmlFor="f-governorate" className="label">المحافظة <span className="text-rose-500">*</span></label>
                <select
                  id="f-governorate"
                  value={form.governorate}
                  onChange={set('governorate')}
                  required
                  aria-invalid={!!errors.governorate}
                  className="field"
                >
                  <option value="">اختر المحافظة…</option>
                  {rates.map((r) => (
                    <option key={r.governorate} value={r.governorate}>
                      {r.governorate} — {num(r.fee)} ج.م
                    </option>
                  ))}
                </select>
                {errors.governorate ? (
                  <span className="err">{errors.governorate}</span>
                ) : rate ? (
                  <span className="num mt-1.5 inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <Truck className="w-3.5 h-3.5" />
                    <span>التوصيل المتوقع: {rate.days_min}–{rate.days_max} يوم عمل</span>
                  </span>
                ) : null}
              </div>

              <div>
                <label htmlFor="f-area" className="label">المدينة أو الحي <span className="text-rose-500">*</span></label>
                <input
                  id="f-area"
                  value={form.area}
                  onChange={set('area')}
                  required
                  minLength={2}
                  aria-invalid={!!errors.area}
                  className="field"
                  placeholder="مدينة نصر / الشيخ زايد"
                />
                {errors.area ? <span className="err">{errors.area}</span> : null}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="f-street" className="label">
                  الشارع والعمارة ورقم الشقة <span className="text-rose-500">*</span>
                </label>
                <input
                  id="f-street"
                  value={form.street}
                  onChange={set('street')}
                  required
                  minLength={8}
                  aria-invalid={!!errors.street}
                  autoComplete="street-address"
                  className="field"
                  placeholder="شارع مصطفى النحاس، عمارة ٤، الدور ٣، شقة ٧"
                />
                {errors.street ? <span className="err">{errors.street}</span> : null}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="f-landmark" className="label">
                  علامة مميزة <span className="text-xs text-[#736B5E] dark:text-[#A8A296] font-normal">(لتسهيل وصول المندوب)</span>
                </label>
                <input
                  id="f-landmark"
                  value={form.landmark}
                  onChange={set('landmark')}
                  className="field"
                  placeholder="بجوار صيدلية العزبي، أمام المسجد"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="f-note" className="label">
                  ملاحظات إضافية <span className="text-xs text-[#736B5E] dark:text-[#A8A296] font-normal">(اختياري)</span>
                </label>
                <textarea
                  id="f-note"
                  value={form.note}
                  onChange={set('note')}
                  rows={2}
                  className="field min-h-[70px] resize-none"
                  placeholder="مثال: الاتصال هاتفياً قبل موعد التسليم بنصف ساعة"
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* ─── ② الدفع ─────────────────────────────────── */}
        {step === 2 ? (
          <section className="rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#14120E] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-[#E8E6E1] dark:border-[#2E2B22] pb-4">
              <h2 className="text-xl font-semibold text-[#1A1814] dark:text-white">طريقة الدفع</h2>
              <p className="mt-1 text-xs text-[#736B5E] dark:text-[#A8A296]">
                اختر طريقة الدفع المناسبة لك. الدفع المسبق يُلغي رسوم التحصيل فوراً.
              </p>
            </div>

            <div className="space-y-3.5">
              {/* عند الاستلام */}
              <PayOption
                value="cod"
                method={method}
                onPick={setMethod}
                icon={Banknote}
                title={PAYMENT_METHOD.cod}
                hint={`تدفع للمندوب نقداً عند الاستلام. يُضاف رسم تحصيل ${egp(codFee)}.`}
              />

              {/* كارت / إلكتروني */}
              <PayOption
                value="card"
                method={method}
                onPick={setMethod}
                icon={CreditCard}
                title={PAYMENT_METHOD.card}
                hint="فيزا، ماستركارد، ومحافظ إلكترونية. بنرسل لك رابط الدفع الآمن (Paymob) عبر واتساب فوراً."
              >
                <p className="text-xs leading-relaxed text-[#736B5E] dark:text-[#A8A296] bg-black/5 dark:bg-white/5 p-3.5 rounded-xl border border-[#E8E6E1] dark:border-[#2E2B22]">
                  سيتم تجهيز رابط الدفع الإلكتروني الآمن المشفر وإرساله لكم عبر واتساب خلال دقائق، ويتم حجز شحنتكم باسمكم لمدة ٢٤ ساعة.
                </p>
              </PayOption>

              {/* تحويل محفظة / إنستاباي */}
              <PayOption
                value="wallet"
                method={method}
                onPick={setMethod}
                icon={Wallet}
                title={PAYMENT_METHOD.wallet}
                hint="فودافون كاش أو إنستاباي مع رفع إيصال التحويل للمراجعة والتأكيد الفوري."
              >
                <div className="space-y-4 pt-1">
                  <div className="rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 p-4">
                    <p className="text-xs text-[#736B5E] dark:text-[#A8A296]">حول المبلغ الإجمالي على الرقم:</p>
                    <p className="num mt-1 font-mono text-lg font-bold text-[#1A1814] dark:text-white" dir="ltr">
                      {settings.wallet_number}
                    </p>
                    <p className="num mt-1 text-xs font-semibold text-[#8B6914] dark:text-[#E8D9B3]">
                      المبلغ المطلوب: {t.shipping == null ? '— حدّد المحافظة أولاً' : egp(t.total)}
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-[#736B5E] dark:text-[#A8A296]">
                      المبلغ النهائي يظهر في صفحة التأكيد، وفي حال وجود أي اختلاف نقوم بالتواصل معك عبر واتساب.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="f-transferRef" className="label">
                      رقم العملية أو رقم المحفظة المحوّل منها <span className="text-rose-500">*</span>
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
                      className="field text-start font-mono"
                      placeholder="آخر ٤ أرقام أو رقم العملية"
                    />
                    {errors.transferRef ? (
                      <span className="err">{errors.transferRef}</span>
                    ) : null}
                  </div>

                  <div>
                    <span className="label">صورة إيصال التحويل <span className="text-rose-500">*</span></span>
                    <label
                      className="flex cursor-pointer items-center justify-between gap-3
                                 border border-dashed border-[#C9A84C]/40 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] hover:bg-[#C9A84C]/5 px-4 py-3.5 transition-colors"
                    >
                      <span className="text-xs text-[#736B5E] dark:text-[#A8A296] truncate">
                        {receipt ? receipt.name : 'اختر صورة الإيصال أو ملف PDF (٥ ميجا كحد أقصى)'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E6E1] dark:border-[#2E2B22] text-xs font-semibold text-[#1A1814] dark:text-white shrink-0 hover:border-[#C9A84C]">
                        <Upload className="w-3.5 h-3.5 text-[#C9A84C]" />
                        <span>تصفّح</span>
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={pickReceipt}
                        className="sr-only"
                      />
                    </label>
                    {errors.receipt ? <span className="err">{errors.receipt}</span> : null}
                    {receipt ? (
                      <span className="num mt-1 block text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        تم اختيار الملف بنجاح ({(receipt.size / 1024 / 1024).toFixed(2)} ميجابايت)
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
          <section className="rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#14120E] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-[#E8E6E1] dark:border-[#2E2B22] pb-4">
              <h2 className="text-xl font-semibold text-[#1A1814] dark:text-white">مراجعة بيانات الطلب</h2>
              <p className="mt-1 text-xs text-[#736B5E] dark:text-[#A8A296]">
                تأكد من صحة البيانات والعنوان قبل تأكيد الطلب النهائي.
              </p>
            </div>

            <div className="space-y-3">
              <ReviewCard
                title="العميل والاتصال"
                value={
                  <div>
                    <span className="font-semibold block text-[#1A1814] dark:text-white">{form.name}</span>
                    <span className="num text-xs font-mono text-[#736B5E] dark:text-[#A8A296] block mt-0.5" dir="ltr">
                      {normalizePhone(form.phone)}
                      {form.phone2 ? ` / ${normalizePhone(form.phone2)}` : ''}
                    </span>
                  </div>
                }
                onEdit={() => setStep(1)}
              />

              <ReviewCard
                title="عنوان الشحن والتسليم"
                value={
                  <div className="text-xs leading-relaxed text-[#1A1814] dark:text-[#F5F2EB]">
                    <span className="font-semibold">{form.governorate} — {form.area}</span>
                    <br />
                    <span>{form.street}</span>
                    {form.landmark ? (
                      <span className="block text-[#736B5E] dark:text-[#A8A296] mt-0.5">
                        علامة مميزة: {form.landmark}
                      </span>
                    ) : null}
                  </div>
                }
                onEdit={() => setStep(1)}
              />

              <ReviewCard
                title="طريقة الدفع المختارة"
                value={
                  <span className="font-semibold text-xs text-[#1A1814] dark:text-white">
                    {PAYMENT_METHOD[method]}
                  </span>
                }
                onEdit={() => setStep(2)}
              />

              {form.note ? (
                <ReviewCard
                  title="ملاحظات العميل"
                  value={<span className="text-xs text-[#736B5E] dark:text-[#A8A296]">{form.note}</span>}
                  onEdit={() => setStep(1)}
                />
              ) : null}
            </div>

            {fatal ? (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs leading-relaxed text-rose-700 dark:text-rose-400 font-semibold"
              >
                {fatal}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* ─── أزرار التحكم بالخطوات ───────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={back}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-[#E8E6E1] dark:border-[#2E2B22] text-xs font-semibold text-[#1A1814] dark:text-[#F5F2EB] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>الخطوة السابقة</span>
            </button>
          ) : (
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-[#E8E6E1] dark:border-[#2E2B22] text-xs font-semibold text-[#1A1814] dark:text-[#F5F2EB] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>متابعة التسوق</span>
            </Link>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={next}
              className="group/btn relative overflow-hidden inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#1A1814] to-[#2D2921] dark:from-[#C9A84C] dark:to-[#8B6914] text-white text-xs font-semibold transition-all duration-300 active:scale-[0.97] shadow-md hover:shadow-lg hover:shadow-[#C9A84C]/20 ms-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              <span className="relative">متابعة الخطوة التالية</span>
              <ArrowLeft className="w-4 h-4 relative" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={busy || couponBusy || couponStale}
              className="group/btn relative overflow-hidden ms-auto px-10 py-3.5 bg-gradient-to-r from-[#1A1814] to-[#2D2921] dark:from-[#C9A84C] dark:to-[#8B6914] text-white text-sm font-semibold rounded-full transition-all duration-300 active:scale-[0.97] shadow-md hover:shadow-lg hover:shadow-[#C9A84C]/20 disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              <div className="relative z-10 flex items-center gap-2">
                {busy ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>جاري تسجيل الطلب…</span>
                  </>
                ) : couponBusy || couponStale ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>جاري تحديث الخصم…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                    <span>تأكيد الطلب — {egp(t.total)}</span>
                  </>
                )}
              </div>
            </button>
          )}
        </div>
      </AnimateIn>

      {/* ══════════════ العمود التاني: ملخص الطلب الفاخر ══════════════ */}
      <AnimateIn direction="left" delay={0.2} className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#14120E] p-6 shadow-sm space-y-5">
          <div className="border-b border-[#E8E6E1] dark:border-[#2E2B22] pb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1A1814] dark:text-white">ملخص الطلب</h2>
            <span className="text-xs text-[#C9A84C] font-semibold bg-[#C9A84C]/10 px-2.5 py-0.5 rounded-full">
              {num(items.reduce((s, i) => s + i.qty, 0))} قطع
            </span>
          </div>
          
          <ul className="divide-y divide-[#E8E6E1]/60 dark:divide-[#2E2B22]/60 max-h-[300px] overflow-y-auto pe-1">
            {items.map((l) => (
              <li key={l.variantId} className="flex items-center gap-3 py-3 text-xs">
                <span className="num w-6 h-6 rounded-md bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 font-semibold text-[#736B5E] dark:text-[#A8A296]">
                  {l.qty}×
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-[#1A1814] dark:text-[#F5F2EB] truncate">{l.name}</span>
                  <span className="block text-[11px] text-[#736B5E] dark:text-[#A8A296] mt-0.5">
                    {l.brandName} · {l.label}
                  </span>
                </span>
                <span className="num shrink-0 font-semibold text-[#1A1814] dark:text-[#F5F2EB]">{egp(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>

          {/* الكوبون الفاخر */}
          <div className="border-t border-[#E8E6E1] dark:border-[#2E2B22] pt-4">
            {coupon ? (
              <div className="flex items-center justify-between gap-3 bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    كود الخصم <span className="font-mono font-bold uppercase">{coupon.code}</span> مفعّل
                  </span>
                </div>
                <button
                  type="button"
                  onClick={dropCoupon}
                  className="text-xs text-rose-500 hover:underline font-semibold"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <div>
                <label htmlFor="f-coupon" className="block text-xs font-semibold text-[#736B5E] dark:text-[#A8A296] mb-1.5">
                  هل لديك كود خصم؟
                </label>
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
                    className="field text-start font-mono text-xs uppercase"
                    placeholder="EID25"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponBusy || !couponInput.trim()}
                    className="px-5 py-2.5 rounded-lg border border-[#E8E6E1] dark:border-[#2E2B22] bg-[#FAF9F5] dark:bg-[#1A1814] text-xs font-semibold text-[#1A1814] dark:text-white hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors shrink-0 disabled:opacity-50"
                  >
                    {couponBusy ? '…' : 'تطبيق'}
                  </button>
                </div>
              </div>
            )}
            {couponMsg ? (
              <p className={`mt-1.5 text-xs font-semibold ${coupon ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                {couponMsg}
              </p>
            ) : null}
          </div>

          {/* الحسابات */}
          <dl className="space-y-2.5 border-t border-[#E8E6E1] dark:border-[#2E2B22] pt-4 text-xs">
            <Line label="مجموع العطور" value={egp(t.subtotal)} />

            {t.discount > 0 ? (
              <Line label="الخصم المطبق" value={`− ${egp(t.discount)}`} tone="sage" />
            ) : null}

            <Line
              label="تكلفة الشحن"
              value={
                t.shipping == null
                  ? 'حدّد المحافظة'
                  : t.freeShip
                    ? 'مجاني'
                    : egp(t.shipping)
              }
              tone={t.freeShip ? 'sage' : t.shipping == null ? 'muted' : undefined}
            />

            {t.cod > 0 ? <Line label="رسم الدفع عند الاستلام" value={egp(t.cod)} /> : null}

            <div className="flex items-baseline justify-between border-t border-[#E8E6E1] dark:border-[#2E2B22] pt-3.5 mt-2">
              <dt className="text-sm font-semibold text-[#1A1814] dark:text-white">الإجمالي النهائي</dt>
              <dd className="num text-base font-bold text-[#C9A84C]">{egp(t.total)}</dd>
            </div>
          </dl>

          {t.remainingForFreeShip != null && t.remainingForFreeShip > 0 ? (
            <div className="rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 p-3 text-xs text-[#8B6914] dark:text-[#E8D9B3] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#C9A84C] shrink-0" />
              <span>
                أضف بقيمة <strong className="num font-bold text-[#1A1814] dark:text-white">{egp(t.remainingForFreeShip)}</strong> لتحصل على شحن مجاني!
              </span>
            </div>
          ) : null}

          <div className="pt-2 border-t border-[#E8E6E1]/60 dark:border-[#2E2B22]/60 flex items-center justify-center gap-4 text-[11px] text-[#736B5E] dark:text-[#A8A296]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C9A84C]" />
              <span>عطور أصلية ١٠٠٪</span>
            </span>
            <span>·</span>
            <span>ضمان سلامة الشحنة</span>
          </div>
        </div>
      </AnimateIn>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   مكونات فرعية فاخرة
   ══════════════════════════════════════════════════════════ */

function PayOption({ value, method, onPick, icon: Icon, title, hint, children }) {
  const on = method === value;

  return (
    <div
      onClick={() => onPick(value)}
      className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer ${
        on
          ? 'border-[#C9A84C] bg-[#C9A84C]/[0.04] dark:bg-[#C9A84C]/[0.08] shadow-sm ring-1 ring-[#C9A84C]/20'
          : 'border-[#E8E6E1] dark:border-[#2E2B22] bg-transparent hover:border-[#C9A84C]/40'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
            on
              ? 'border-[#C9A84C] bg-[#C9A84C]'
              : 'border-[#E8E6E1] dark:border-[#2E2B22] bg-transparent'
          }`}
        >
          {on ? <div className="w-2 h-2 rounded-full bg-white" /> : null}
        </div>

        {Icon ? (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              on
                ? 'bg-[#C9A84C]/20 text-[#8B6914] dark:text-[#E8D9B3]'
                : 'bg-black/5 dark:bg-white/5 text-[#736B5E] dark:text-[#A8A296]'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[#1A1814] dark:text-white">{title}</span>
          <span className="mt-0.5 block text-xs text-[#736B5E] dark:text-[#A8A296] leading-relaxed">{hint}</span>
        </div>
      </div>

      {on && children ? (
        <div className="mt-4 pt-4 border-t border-[#E8E6E1] dark:border-[#2E2B22]">{children}</div>
      ) : null}
    </div>
  );
}

function ReviewCard({ title, value, onEdit }) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-black/[0.02] dark:bg-white/[0.02]">
      <div>
        <span className="text-xs text-[#736B5E] dark:text-[#A8A296] block font-medium mb-1">{title}</span>
        {value}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-xs font-semibold text-[#C9A84C] hover:underline shrink-0"
      >
        تعديل
      </button>
    </div>
  );
}

function Line({ label, value, tone }) {
  const color =
    tone === 'sage'
      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
      : tone === 'muted'
      ? 'text-[#736B5E] dark:text-[#A8A296]'
      : 'text-[#1A1814] dark:text-[#F5F2EB] font-medium';
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[#736B5E] dark:text-[#A8A296]">{label}</dt>
      <dd className={`num ${color}`}>{value}</dd>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   شاشة النجاح الفاخرة بعد إتمام الطلب
   ══════════════════════════════════════════════════════════ */
function Done({ done, form, settings, rate }) {
  const wa = settings.wa_number;
  const [copied, setCopied] = useState(false);

  function copyOrderNo() {
    navigator?.clipboard?.writeText(done.order_no);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const lines = (done.lines || [])
    .map((l) => `• ${l.name} (${l.brandName || ''}) — ${l.label || ''} × ${l.qty}`)
    .join('\n');

  const msg = [
    `طلب رقم ${done.order_no} — محمود علي للعطور`,
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
    <div className="mx-auto max-w-2xl py-6 sm:py-10">
      <div className="rounded-3xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#14120E] p-6 sm:p-12 text-center shadow-xl relative overflow-hidden space-y-6">
        {/* Ambient top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-[#C9A84C]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#C9A84C]/15 text-[#8B6914] dark:text-[#E8D9B3] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A84C]" />
            <span>تم استلام وتأكيد طلبك بنجاح</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#1A1814] dark:text-white">شكراً لثقتكم بنا</h1>
          <p className="mt-2 text-xs sm:text-sm text-[#736B5E] dark:text-[#A8A296] max-w-md mx-auto leading-relaxed">
            سيتم تجهيز وتغليف شحنتكم بعناية فائقة لتصلكم بأسرع وقت.
          </p>
        </div>

        {/* كارت رقم الطلب القابل للنسخ */}
        <div className="rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-[#FAF9F5] dark:bg-[#1A1814] p-4 sm:p-5 max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="text-start">
            <span className="text-[11px] text-[#736B5E] dark:text-[#A8A296] block font-medium">رقم الطلب للمتابعة</span>
            <span className="num font-mono text-xl sm:text-2xl font-bold text-[#C9A84C] tracking-wide" dir="ltr">
              {done.order_no}
            </span>
          </div>

          <button
            type="button"
            onClick={copyOrderNo}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#14120E] text-xs font-semibold text-[#1A1814] dark:text-white hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>تم النسخ!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#C9A84C]" />
                <span>نسخ الرقم</span>
              </>
            )}
          </button>
        </div>

        {/* تفاصيل الحساب */}
        <div className="rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#14120E] p-5 text-start space-y-3">
          <Line label="المجموع الفرعي" value={egp(done.subtotal)} />
          {done.discount > 0 ? (
            <Line label="الخصم" value={`− ${egp(done.discount)}`} tone="sage" />
          ) : null}
          <Line
            label="تكلفة الشحن"
            value={done.shipping_fee > 0 ? egp(done.shipping_fee) : 'مجاني'}
            tone={done.shipping_fee > 0 ? undefined : 'sage'}
          />
          {done.cod_fee > 0 ? (
            <Line label="رسم الدفع عند الاستلام" value={egp(done.cod_fee)} />
          ) : null}
          <div className="flex items-baseline justify-between border-t border-[#E8E6E1] dark:border-[#2E2B22] pt-3">
            <dt className="text-sm font-semibold text-[#1A1814] dark:text-white">الإجمالي النهائي</dt>
            <dd className="num text-base font-bold text-[#C9A84C]">{egp(done.total)}</dd>
          </div>
        </div>

        {rate ? (
          <p className="num text-xs text-[#736B5E] dark:text-[#A8A296] inline-flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-[#C9A84C]" />
            <span>
              التوصيل المتوقع خلال {rate.days_min}–{rate.days_max} يوم عمل لمحافظة {form.governorate}.
            </span>
          </p>
        ) : null}

        {/* تعليمات الدفع */}
        {done.method === 'card' ? (
          <div className="rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 p-4 text-xs leading-relaxed text-[#8B6914] dark:text-[#E8D9B3] font-semibold text-start">
            سيتم إرسال رابط الدفع الإلكتروني الآمن المشفر عبر واتساب خلال دقائق. شحنتكم محجوزة لمدة ٢٤ ساعة.
          </div>
        ) : null}

        {done.method === 'wallet' ? (
          <div className="rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 p-4 text-xs leading-relaxed text-[#8B6914] dark:text-[#E8D9B3] text-start space-y-1">
            <p className="font-bold">تم استلام صورة التحويل بنجاح وجاري مراجعتها وتأكيد الطلب خلال دقائق.</p>
            <p className="num">المبلغ المعتمد للطلب: {egp(done.total)}</p>
          </div>
        ) : null}

        {/* أزرار الإجراءات */}
        <div className="pt-4 space-y-3">
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn relative overflow-hidden w-full py-3.5 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-md shadow-[#25D366]/20 active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>إرسال تفاصيل الطلب عبر واتساب للتأكيد السريع</span>
            </a>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Link
              href="/track"
              className="flex-1 py-3 rounded-full border border-[#E8E6E1] dark:border-[#2E2B22] text-xs font-semibold text-[#1A1814] dark:text-white hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <span>تتبع حالة الطلب</span>
            </Link>
            <Link
              href="/products"
              className="flex-1 py-3 rounded-full bg-gradient-to-r from-[#1A1814] to-[#2D2921] dark:from-[#C9A84C] dark:to-[#8B6914] text-white text-xs font-semibold transition-all duration-300 inline-flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>متابعة التسوق</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
