'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { egp, num } from '@/lib/money';
import { toPositiveInt, toPositiveNumber } from '@/lib/validate';

export default function ShippingManager({ rates, settings }) {
  return (
    <div className="space-y-5">
      <SettingsPanel initial={settings} />
      <RatesPanel initial={rates} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   الإعدادات العامة — قيم رقمية ونصية بتتخزن jsonb
   ══════════════════════════════════════════════════════════ */
const FIELDS = [
  {
    key: 'free_ship_threshold',
    label: 'الشحن مجاني من (ج.م)',
    hint: 'العميل بيشوف "ناقصك كذا للشحن المجاني" في العربة. حُطّ صفر لو مش عايز العرض ده.',
    type: 'number',
  },
  {
    key: 'cod_fee',
    label: 'رسم التحصيل عند الاستلام (ج.م)',
    hint: 'بيتزوّد على الأوردرات اللي بتتدفع كاش للمندوب بس.',
    type: 'number',
  },
  {
    key: 'wallet_number',
    label: 'رقم إنستاباي / فودافون كاش',
    hint: 'ده الرقم اللي العميل بيحوّل عليه ويرفع الإيصال. راجعه كويس.',
    type: 'phone',
  },
  {
    key: 'wa_number',
    label: 'واتساب البراند (صيغة دولية)',
    hint: 'من غير + ولا أصفار في الأول — يعني 201012345678.',
    type: 'phone',
  },
  {
    key: 'announcement',
    label: 'شريط الإعلان أعلى الموقع',
    hint: 'سيبه فاضي والشريط يختفي.',
    type: 'text',
  },
  { key: 'store_name', label: 'اسم المتجر', hint: '', type: 'text' },
];

function SettingsPanel({ initial }) {
  const router = useRouter();

  const [vals, setVals] = useState(() => {
    const o = {};
    for (const f of FIELDS) {
      const raw = initial?.[f.key];
      o[f.key] = raw == null ? '' : String(raw);
    }
    return o;
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const set = (k) => (e) => {
    setVals((v) => ({ ...v, [k]: e.target.value }));
    setOk('');
  };

  async function save() {
    setError('');
    setOk('');

    const wa = vals.wa_number.replace(/\D/g, '');
    if (wa && !/^20[0-9]{10}$/.test(wa))
      return setError('رقم الواتساب لازم يبدأ بـ 20 وبعده الرقم من غير الصفر — يعني 201012345678.');

    const wallet = vals.wallet_number.replace(/\D/g, '');
    if (wallet && !/^01[0125][0-9]{8}$/.test(wallet))
      return setError('رقم المحفظة لازم يكون موبايل مصري صحيح — ١١ رقم.');

    setBusy(true);
    try {
      const supabase = createClient();

      // jsonb: الأرقام تتخزن أرقام، والنص يتخزن نص
      const rows = FIELDS.map((f) => ({
        key: f.key,
        value:
          f.type === 'number'
            ? toPositiveNumber(vals[f.key])
            : f.key === 'wa_number'
              ? wa
              : f.key === 'wallet_number'
                ? wallet
                : vals[f.key].trim(),
        label: f.label,
      }));

      const { error: dbError } = await supabase
        .from('settings')
        .upsert(rows, { onConflict: 'key' });
      if (dbError) throw dbError;

      setOk('اتسجّل. المتجر بيحدّث نفسه في حدود دقيقة.');
      router.refresh();
    } catch (e) {
      setError(e?.message || 'مانفعش يتسجّل.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="surface p-5 sm:p-6">
      <h2 className="font-display text-d1">إعدادات عامة</h2>
      <p className="mt-1.5 text-xs2 leading-relaxed text-ink-60">
        الأرقام دي بتدخل في حساب الأوردر جوّه الداتابيز — يعني أي تعديل هنا بيسري
        على كل أوردر جديد فوراً.
      </p>

      {error ? (
        <p role="alert" className="mt-4 border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="mt-4 border border-sage bg-sage/8 px-4 py-2.5 text-xs2 text-sage">{ok}</p>
      ) : null}

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className={f.key === 'announcement' ? 'sm:col-span-2' : ''}>
            <label htmlFor={`s-${f.key}`} className="label">{f.label}</label>
            <input
              id={`s-${f.key}`}
              value={vals[f.key]}
              onChange={set(f.key)}
              inputMode={f.type === 'number' ? 'decimal' : f.type === 'phone' ? 'numeric' : 'text'}
              min={f.type === 'number' ? '0' : undefined}
              step={f.type === 'number' ? 'any' : undefined}
              maxLength={f.key === 'announcement' ? 150 : f.type === 'phone' ? 12 : undefined}
              dir={f.type === 'text' ? 'rtl' : 'ltr'}
              className={f.type === 'text' ? 'field' : 'field text-start'}
              placeholder={f.key === 'announcement' ? 'اكتب الإعلان هنا ليظهر متحركاً في الشريط الأعلى للموقع…' : undefined}
            />
            {f.hint ? (
              <p className="mt-1 text-xs2 leading-relaxed text-ink-42">{f.hint}</p>
            ) : null}
          </div>
        ))}
      </div>

      <button type="button" onClick={save} disabled={busy} className="btn-solid mt-5 px-8">
        {busy ? 'بيتسجّل…' : 'اسجّل الإعدادات'}
      </button>
    </section>
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
      setOk(`اتسجّلت ${num(dirty.length)} محافظة.`);
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
