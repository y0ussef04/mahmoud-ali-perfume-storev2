'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { invalidateCacheTag } from '@/lib/actions/revalidate';
import { parseStrictPositiveNumber, toPositiveInt, toPositiveNumber } from '@/lib/validate';
import { egp, num } from '@/lib/money';

export default function ShippingManager({ rates, settings }) {
  return (
    <div className="space-y-5">
      <SettingsPanel initial={settings} />
      <RatesPanel initial={rates} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   الإعدادات العامة والشريط الإعلاني المتحرك
   ══════════════════════════════════════════════════════════ */
const GENERAL_FIELDS = [
  {
    key: 'store_name',
    label: 'اسم المتجر',
    hint: 'الاسم الذي يظهر في الفواتير والرسائل ورأس الموقع.',
    type: 'text',
  },
  {
    key: 'free_ship_threshold',
    label: 'حد الشحن المجاني (ج.م)',
    hint: 'العميل يرى "ناقصك كذا للشحن المجاني" في العربة. ضع 0 لإلغاء ميزة الشحن المجاني.',
    type: 'number',
  },
  {
    key: 'cod_fee',
    label: 'رسم الدفع عند الاستلام (ج.م)',
    hint: 'يُضاف تلقائياً للأوردرات المختارة نقداً عند الاستلام فقط.',
    type: 'number',
  },
  {
    key: 'wallet_number',
    label: 'رقم إنستاباي / فودافون كاش',
    hint: 'الرقم الذي يحوّل عليه العميل ويرفع الإيصال (مثال: 01012345678).',
    type: 'phone',
  },
  {
    key: 'wa_number',
    label: 'واتساب خدمة العملاء (صيغة دولية)',
    hint: 'يبدأ بـ 20 وبدون علامة + أو أصفار إضافية (مثال: 201012345678).',
    type: 'phone',
  },
];

const PRESETS = [
  '🔥 تخفيضات لفترة محدودة على تشكيلة العطور الأكثر طلباً — تسوق الآن!',
  '✨ كود خصم حصري: استخدم MAHMOUD10 واحصل على خصم 10% فوراً',
  '📦 تغليف هدايا فاخر وشحن سريع لجميع محافظات مصر',
];

function SettingsPanel({ initial }) {
  const router = useRouter();

  // حالة الشريط الإعلاني
  const [announcementEnabled, setAnnouncementEnabled] = useState(() => {
    const raw = initial?.announcement_enabled;
    if (raw === false || raw === 'false' || raw === 'off' || raw === 0) return false;
    return true;
  });

  const [announcementMode, setAnnouncementMode] = useState(() => {
    return initial?.announcement_mode || 'custom_and_features';
  });

  const [announcementText, setAnnouncementText] = useState(() => {
    return initial?.announcement != null ? String(initial.announcement) : '';
  });

  // الإعدادات العامة الأخرى
  const [vals, setVals] = useState(() => {
    const o = {};
    for (const f of GENERAL_FIELDS) {
      const raw = initial?.[f.key];
      o[f.key] = raw == null ? '' : String(raw);
    }
    return o;
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const setGeneral = (k) => (e) => {
    setVals((v) => ({ ...v, [k]: e.target.value }));
    setOk('');
  };

  // جمل المعاينة الحية
  const thresholdVal = Number(vals.free_ship_threshold) || 0;
  const shipText = thresholdVal > 0 
    ? `🚚 شحن مجاني لجميع المحافظات للطلبات بقيمة ${egp(thresholdVal)} فأكثر` 
    : '🚚 شحن مجاني لكل المحافظات';

  const previewPhrases = useMemo(() => {
    if (!announcementEnabled) return [];
    const custom = announcementText.trim();
    if (announcementMode === 'custom_only') {
      return custom ? [custom] : ['(اكتب نص الإعلان ليظهر هنا)'];
    }
    if (announcementMode === 'features_only') {
      return [
        shipText,
        '💵 خيارات دفع مرنة: عند الاستلام، الفيزا، المحافظ، وإنستاباي',
        '📦 تغليف فاخر وضمان وصول آمن للشحنة',
        '✨ عطور إماراتية وسعودية أصلية ١٠٠٪ في مصر',
      ];
    }
    // custom_and_features
    return [
      custom ? `✨ ${custom}` : null,
      shipText,
      '💵 خيارات دفع مرنة: عند الاستلام، الفيزا، المحافظ، وإنستاباي',
      '📦 تغليف فاخر وضمان وصول آمن للشحنة',
      '✨ عطور إماراتية وسعودية أصلية ١٠٠٪ في مصر',
    ].filter(Boolean);
  }, [announcementEnabled, announcementMode, announcementText, shipText]);

  async function save() {
    setError('');
    setOk('');

    const wa = (vals.wa_number || '').replace(/\D/g, '');
    if (wa && !/^20[0-9]{10}$/.test(wa)) {
      return setError('رقم الواتساب لازم يبدأ بـ 20 وبعده الرقم بدون الصفر — مثال: 201012345678.');
    }

    const wallet = (vals.wallet_number || '').replace(/\D/g, '');
    if (wallet && !/^01[0125][0-9]{8}$/.test(wallet)) {
      return setError('رقم المحفظة لازم يكون موبايل مصري صحيح مكون من ١١ رقم.');
    }

    for (const f of GENERAL_FIELDS) {
      if (f.type === 'number') {
        try {
          parseStrictPositiveNumber(vals[f.key], f.label, { allowZero: true });
        } catch (valErr) {
          return setError(valErr.message);
        }
      }
    }

    setBusy(true);
    try {
      const supabase = createClient();

      // الصفوف التي سيتم تحديثها
      const rows = [
        ...GENERAL_FIELDS.map((f) => ({
          key: f.key,
          value:
            f.type === 'number'
              ? parseStrictPositiveNumber(vals[f.key], f.label, { allowZero: true }) ?? 0
              : f.key === 'wa_number'
                ? wa
                : f.key === 'wallet_number'
                  ? wallet
                  : (vals[f.key] || '').trim(),
          label: f.label,
        })),
        {
          key: 'announcement',
          value: announcementText.trim(),
          label: 'شريط الإعلان أعلى الموقع',
        },
        {
          key: 'announcement_enabled',
          value: announcementEnabled,
          label: 'تفعيل شريط الإعلان',
        },
        {
          key: 'announcement_mode',
          value: announcementMode,
          label: 'وضع عرض شريط الإعلان',
        },
      ];

      const { error: dbError } = await supabase
        .from('settings')
        .upsert(rows, { onConflict: 'key' });
      if (dbError) throw dbError;

      await invalidateCacheTag('settings');
      setOk('تم حفظ الإعدادات والشريط الإعلاني بنجاح وتحديث المتجر فوراً.');
      router.refresh();
    } catch (e) {
      setError(e?.message || 'تعذر حفظ الإعدادات.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ══════════ قسم التحكم في الشريط الإعلاني المتحرك ══════════ */}
      <section className="surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hair-soft pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-d1">الشريط الإعلاني المتحرك أعلى المتجر</h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  announcementEnabled
                    ? 'bg-sage/10 text-sage border border-sage/20'
                    : 'bg-garnet/10 text-garnet border border-garnet/20'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${announcementEnabled ? 'bg-sage animate-pulse' : 'bg-garnet'}`} />
                {announcementEnabled ? 'مفعّل حالياً' : 'معطّل ومخفي'}
              </span>
            </div>
            <p className="mt-1 text-xs2 text-ink-60">
              تحكم كامل في ظهور الشريط، النصوص المعروضة، ومزايا المتجر التلقائية.
            </p>
          </div>

          {/* سويتش التشغيل / التعطيل */}
          <button
            type="button"
            role="switch"
            aria-checked={announcementEnabled}
            onClick={() => {
              setAnnouncementEnabled((v) => !v);
              setOk('');
            }}
            className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brass focus:ring-offset-2 ${
              announcementEnabled ? 'bg-brass' : 'bg-hair'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                announcementEnabled ? '-translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* وضع العرض */}
        {announcementEnabled ? (
          <div className="mt-5 space-y-5">
            <div>
              <label className="label mb-2">طريقة عرض محتوى الشريط:</label>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'custom_and_features',
                    title: 'إعلان مخصص + مزايا المتجر',
                    desc: 'يعرض نص إعلانك متبوعاً بالشحن والتغليف والدفع',
                    icon: '✨',
                  },
                  {
                    id: 'custom_only',
                    title: 'إعلاني المخصص فقط',
                    desc: 'يعرض فقط النص المكتوب أدناه بدون المزايا الأخرى',
                    icon: '📢',
                  },
                  {
                    id: 'features_only',
                    title: 'مزايا المتجر التلقائية فقط',
                    desc: 'يعرض الشحن المجاني والتغليف والدفع بدون نص مخصص',
                    icon: '🏷️',
                  },
                ].map((m) => {
                  const active = announcementMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setAnnouncementMode(m.id);
                        setOk('');
                      }}
                      className={`text-start p-3.5 rounded-xl border transition-all text-xs leading-relaxed ${
                        active
                          ? 'border-brass bg-brass/8 text-oud shadow-sm'
                          : 'border-hair bg-elevated text-ink-60 hover:border-hair-soft'
                      }`}
                    >
                      <div className="font-semibold text-sm flex items-center gap-1.5 text-oud">
                        <span>{m.icon}</span>
                        <span>{m.title}</span>
                      </div>
                      <p className="mt-1 text-ink-60 text-xs2">{m.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* حقل النص المخصص (إذا كان الوضع يتضمن نص مخصص) */}
            {announcementMode !== 'features_only' ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="announcement-text" className="label mb-0">
                    نص الإعلان المخصص:
                  </label>
                  <span className="text-xs2 num text-ink-42">
                    {announcementText.length} / 150 حرف
                  </span>
                </div>
                <input
                  id="announcement-text"
                  value={announcementText}
                  onChange={(e) => {
                    setAnnouncementText(e.target.value);
                    setOk('');
                  }}
                  maxLength={150}
                  dir="rtl"
                  className="field text-start"
                  placeholder="مثال: خصم ٢٠٪ بمناسبة الافتتاح، استخدم كود: MAHMOUD20..."
                />
                
                {/* اقتراحات سريعة */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs2 text-ink-42">اقتراحات سريعة:</span>
                  {PRESETS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setAnnouncementText(p);
                        setOk('');
                      }}
                      className="text-xs2 px-2.5 py-1 rounded-md bg-hair/40 hover:bg-hair hover:text-oud text-ink-60 transition-colors"
                    >
                      {p.slice(0, 35)}…
                    </button>
                  ))}
                  {announcementText ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAnnouncementText('');
                        setOk('');
                      }}
                      className="text-xs2 px-2 py-1 text-garnet hover:underline"
                    >
                      مسح النص
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* المعاينة الحية للشريط المتحرك */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink-60 flex items-center gap-1.5">
                  <span>👁️</span>
                  <span>معاينة حية ومباشرة للشريط كما يراه الزائر في أعلى الموقع:</span>
                </span>
                <span className="text-xs2 text-ink-42">(قف بالماوس لإيقاف الحركة مؤقتاً)</span>
              </div>
              <div className="rounded-lg overflow-hidden border border-[#2E2B22] shadow-inner bg-[#1A1814] text-xs py-2 text-[#C9A84C] font-semibold select-none">
                <div className="animate-marquee gap-8 items-center whitespace-nowrap">
                  <span className="inline-flex items-center gap-6 px-4">
                    {previewPhrases.map((phrase, idx) => (
                      <span key={idx} className="inline-flex items-center gap-6">
                        <span>{phrase}</span>
                        <span className="text-[#6B6760]">✦</span>
                      </span>
                    ))}
                  </span>
                  <span className="inline-flex items-center gap-6 px-4" aria-hidden="true">
                    {previewPhrases.map((phrase, idx) => (
                      <span key={`dup-${idx}`} className="inline-flex items-center gap-6">
                        <span>{phrase}</span>
                        <span className="text-[#6B6760]">✦</span>
                      </span>
                    ))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-hair-soft bg-elevated/50 p-4 text-center">
            <p className="text-xs font-semibold text-ink-60">
              🚫 الشريط الإعلاني معطّل حالياً — لن يظهر أي شريط أعلى المتجر للزوار.
            </p>
            <p className="mt-1 text-xs2 text-ink-42">
              اضغط على السويتش بالأعلى في أي وقت لتفعيله وعرض إعلاناتك ومزايا متجرك.
            </p>
          </div>
        )}
      </section>

      {/* ══════════ قسم الإعدادات المالية والتواصل ══════════ */}
      <section className="surface p-5 sm:p-6">
        <h2 className="font-display text-d1">إعدادات المتجر العامة والمالية</h2>
        <p className="mt-1 text-xs2 leading-relaxed text-ink-60">
          هذه القيم تؤثر مباشرة في حساب الأوردرات ونظام التحويل والتواصل مع العملاء.
        </p>

        {error ? (
          <p role="alert" className="mt-4 border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet rounded-lg">
            {error}
          </p>
        ) : null}
        {ok ? (
          <p className="mt-4 border border-sage bg-sage/8 px-4 py-2.5 text-xs2 text-sage rounded-lg">{ok}</p>
        ) : null}

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {GENERAL_FIELDS.map((f) => (
            <div key={f.key}>
              <label htmlFor={`s-${f.key}`} className="label">{f.label}</label>
              <input
                id={`s-${f.key}`}
                value={vals[f.key]}
                onChange={setGeneral(f.key)}
                inputMode={f.type === 'number' ? 'decimal' : f.type === 'phone' ? 'numeric' : 'text'}
                min={f.type === 'number' ? '0' : undefined}
                step={f.type === 'number' ? 'any' : undefined}
                maxLength={f.type === 'phone' ? 12 : undefined}
                dir={f.type === 'text' ? 'rtl' : 'ltr'}
                className={f.type === 'text' ? 'field' : 'field text-start'}
              />
              {f.hint ? (
                <p className="mt-1 text-xs2 leading-relaxed text-ink-42">{f.hint}</p>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-hair-soft flex items-center justify-between">
          <button type="button" onClick={save} disabled={busy} className="btn-solid px-8">
            {busy ? 'جارٍ الحفظ…' : 'حفظ الإعدادات والشريط'}
          </button>
          <span className="text-xs2 text-ink-42">تحديث فوري للمتجر بمجرد الحفظ</span>
        </div>
      </section>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   مصاريف الشحن لكل محافظة
   ══════════════════════════════════════════════════════════ */
function RatesPanel({ initial }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial || []);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [bulk, setBulk] = useState('');

  const dirty = useMemo(() => rows.filter((r) => r._dirty), [rows]);

  function patch(id, p) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p, _dirty: true } : r)));
    setOk('');
  }

  async function saveAll() {
    if (dirty.length === 0) return;

    for (const r of dirty) {
      if (toPositiveNumber(r.fee, -1) < 0) return setError(`سعر ${r.governorate} مش رقم صحيح.`);
      const dmin = toPositiveInt(r.days_min, 0);
      const dmax = toPositiveInt(r.days_max, 0);
      if (dmin < 1 || dmax < dmin)
        return setError(`مدة التوصيل في ${r.governorate} مش منطقية — "من" لازم تكون ١ أو أكتر و"لـ" أكبر منها أو زيها.`);
    }

    setBusy('all');
    setError('');
    setOk('');

    try {
      const supabase = createClient();

      // سطر سطر — عددهم ٢٧ بالكتير، ومحتاجين نعرف السطر اللي وقع
      for (const r of dirty) {
        const { error: dbError } = await supabase
          .from('shipping_rates')
          .update({
            fee: toPositiveNumber(r.fee),
            days_min: toPositiveInt(r.days_min, 2),
            days_max: toPositiveInt(r.days_max, 5),
            is_active: !!r.is_active,
          })
          .eq('id', r.id);
        if (dbError) throw new Error(`${r.governorate}: ${dbError.message}`);
      }

      setRows((rs) => rs.map((r) => ({ ...r, _dirty: false })));
      await invalidateCacheTag('shipping');
      setOk(`اتسجّلت ${num(dirty.length)} محافظة وتحدث المتجر فوراً.`);
      router.refresh();
    } catch (e) {
      setError(e?.message || 'مانفعش يتسجّل.');
    } finally {
      setBusy('');
    }
  }

  /** يحطّ نفس السعر على كل المحافظات المعروضة — للتعديل السريع */
  function applyBulk() {
    const fee = toPositiveNumber(bulk, -1);
    if (fee < 0) return setError('اكتب سعر صحيح.');
    setError('');
    setRows((rs) => rs.map((r) => ({ ...r, fee, _dirty: true })));
    setOk('اتحدّد على كل السطور — اضغط "اسجّل التعديلات" لو موافق.');
  }

  return (
    <section className="surface p-5 sm:p-6">
      <h2 className="font-display text-d1">مصاريف الشحن</h2>
      <p className="mt-1.5 text-xs2 leading-relaxed text-ink-60">
        العميل بيشوف السعر والمدة أول ما يختار المحافظة. المحافظة اللي بتشيل
        علامة «بنشحن» منها بتختفي من قائمة الاختيار خالص.
      </p>

      {error ? (
        <p role="alert" className="mt-4 border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="mt-4 border border-sage bg-sage/8 px-4 py-2.5 text-xs2 text-sage">{ok}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-end gap-3 border-b border-hair-soft pb-5">
        <div>
          <label htmlFor="sr-bulk" className="label">سعر واحد لكل المحافظات</label>
          <input
            id="sr-bulk"
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            inputMode="decimal"
            dir="ltr"
            className="field w-32 text-start"
            placeholder="60"
          />
        </div>
        <button type="button" onClick={applyBulk} className="btn-ghost">
          طبّقه على الكل
        </button>

        <span className="flex-1" />

        <button
          type="button"
          onClick={saveAll}
          disabled={busy === 'all' || dirty.length === 0}
          className="btn-solid"
        >
          {busy === 'all'
            ? 'بيتسجّل…'
            : dirty.length > 0
              ? `اسجّل التعديلات (${num(dirty.length)})`
              : 'مافيش تعديلات'}
        </button>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>المحافظة</th>
              <th className="w-32">السعر</th>
              <th className="w-24">من (يوم)</th>
              <th className="w-24">لـ (يوم)</th>
              <th className="w-20">بنشحن</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r._dirty ? 'bg-brass/6' : undefined}>
                <td>
                  {r.governorate}
                  {!r._dirty && Number(r.fee) === 0 ? (
                    <span className="block text-xs2 text-sage">شحن مجاني</span>
                  ) : null}
                </td>
                <td>
                  <input
                    value={r.fee ?? ''}
                    onChange={(e) => patch(r.id, { fee: e.target.value })}
                    inputMode="decimal"
                    dir="ltr"
                    className="field text-start"
                    aria-label={`سعر شحن ${r.governorate}`}
                  />
                </td>
                <td>
                  <input
                    value={r.days_min ?? ''}
                    onChange={(e) => patch(r.id, { days_min: e.target.value })}
                    inputMode="numeric"
                    dir="ltr"
                    className="field text-start"
                    aria-label={`أقل مدة توصيل ${r.governorate}`}
                  />
                </td>
                <td>
                  <input
                    value={r.days_max ?? ''}
                    onChange={(e) => patch(r.id, { days_max: e.target.value })}
                    inputMode="numeric"
                    dir="ltr"
                    className="field text-start"
                    aria-label={`أقصى مدة توصيل ${r.governorate}`}
                  />
                </td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={!!r.is_active}
                    onChange={(e) => patch(r.id, { is_active: e.target.checked })}
                    className="accent-brass"
                    aria-label={`بنشحن لـ ${r.governorate}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="num mt-4 text-xs2 text-ink-42">
        متوسط سعر الشحن الحالي:{' '}
        {egp(
          rows.length
            ? Math.round(
                rows.reduce((s, r) => s + toPositiveNumber(r.fee), 0) / rows.length
              )
            : 0
        )}
      </p>
    </section>
  );
}
