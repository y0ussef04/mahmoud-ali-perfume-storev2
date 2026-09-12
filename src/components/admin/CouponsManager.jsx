'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { COUPON_KIND } from '@/lib/labels';
import { dateAr, egp, num } from '@/lib/money';
import { toPositiveInt, toPositiveNumber, validateCouponData } from '@/lib/validate';

/* الكود لاتيني/أرقام/شرطة بس وبالكابيتال — كده مافيش لبس بين أشكال متشابهة */
const cleanCode = (v) =>
  String(v || '')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 24);

/** timestamptz → قيمة تنفع في input[type=date] */
const toDateInput = (iso) => (iso ? String(iso).slice(0, 10) : '');

/** input[type=date] → ISO. تاريخ النهاية بياخد آخر اللحظة في اليوم */
function fromDateInput(v, endOfDay) {
  if (!v) return null;
  return new Date(`${v}T${endOfDay ? '23:59:59' : '00:00:00'}`).toISOString();
}

const BLANK = {
  code: '',
  kind: 'percent',
  value: '',
  min_subtotal: '',
  max_uses: '',
  starts_at: '',
  ends_at: '',
  is_active: true,
};

/** حالة الكود دلوقتي — نفس المنطق اللي في دالة الكوبون في السيرفر */
function liveState(c) {
  const now = Date.now();
  if (!c.is_active) return { text: 'موقوف', tone: 'off' };
  if (c.starts_at && new Date(c.starts_at).getTime() > now)
    return { text: 'لسه مابدأش', tone: 'wait' };
  if (c.ends_at && new Date(c.ends_at).getTime() < now)
    return { text: 'خلصت مدته', tone: 'off' };
  if (c.max_uses != null && c.used_count >= c.max_uses)
    return { text: 'خلص عدد مرات الاستخدام', tone: 'off' };
  return { text: 'شغّال', tone: 'on' };
}

export default function CouponsManager({ initial }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial || []);
  const [draft, setDraft] = useState(BLANK);
  const [editing, setEditing] = useState(null); // نسخة الشغل من الكود اللي بيتعدّل
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const setD = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setDraft((d) => ({ ...d, [k]: k === 'code' ? cleanCode(v) : v }));
  };

  const setE = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setEditing((d) => ({ ...d, [k]: v }));
  };

  /** بيحوّل الفورم لسطر جاهز للداتابيز، وبيرجع نص خطأ لو فيه غلط */
  function shape(f) {
    try {
      const starts = fromDateInput(f.starts_at, false);
      const ends = fromDateInput(f.ends_at, true);
      return validateCouponData({
        ...f,
        starts_at: starts,
        ends_at: ends,
      });
    } catch (err) {
      return err.message;
    }
  }

  async function create() {
    setError('');
    setOk('');
    const row = shape(draft);
    if (typeof row === 'string') return setError(row);

    setBusy('add');
    try {
      const supabase = createClient();
      const { data, error: dbError } = await supabase
        .from('coupons')
        .insert(row)
        .select('*')
        .single();
      if (dbError) throw dbError;

      setRows((rs) => [data, ...rs]);
      setDraft(BLANK);
      setOk(`الكود ${data.code} بقى موجود.`);
      router.refresh();
    } catch (e) {
      setError(
        /duplicate/i.test(e?.message || '')
          ? 'الكود ده موجود قبل كده. غيّره أو عدّل القديم.'
          : e?.message || 'مانفعش يتسجّل.'
      );
    } finally {
      setBusy('');
    }
  }

  async function saveEdit() {
    setError('');
    setOk('');
    const row = shape(editing);
    if (typeof row === 'string') return setError(row);

    setBusy(editing.id);
    try {
      const supabase = createClient();
      const { data, error: dbError } = await supabase
        .from('coupons')
        .update(row)
        .eq('id', editing.id)
        .select('*')
        .single();
      if (dbError) throw dbError;

      setRows((rs) => rs.map((r) => (r.id === data.id ? data : r)));
      setEditing(null);
      setOk('اتسجّل.');
      router.refresh();
    } catch (e) {
      setError(
        /duplicate/i.test(e?.message || '') ? 'الكود ده موجود في سطر تاني.' : e?.message
      );
    } finally {
      setBusy('');
    }
  }

  async function toggle(c) {
    setBusy(c.id);
    setError('');
    try {
      const supabase = createClient();
      const { data, error: dbError } = await supabase
        .from('coupons')
        .update({ is_active: !c.is_active })
        .eq('id', c.id)
        .select('*')
        .single();
      if (dbError) throw dbError;

      setRows((rs) => rs.map((r) => (r.id === data.id ? data : r)));
      router.refresh();
    } catch (e) {
      setError(e?.message || 'مانفعش يتغيّر.');
    } finally {
      setBusy('');
    }
  }

  async function remove(c) {
    setBusy(c.id);
    setError('');
    try {
      const supabase = createClient();
      const { error: dbError } = await supabase.from('coupons').delete().eq('id', c.id);
      if (dbError) throw dbError;
      setRows((rs) => rs.filter((r) => r.id !== c.id));
      router.refresh();
    } catch (e) {
      setError(e?.message || 'الحذف مانفعش.');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-5">
      {error ? (
        <p role="alert" className="border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="border border-sage bg-sage/8 px-4 py-3 text-xs1 text-sage">{ok}</p>
      ) : null}

      {/* ── كود جديد ── */}
      <section className="surface p-5 sm:p-6">
        <h2 className="font-display text-d1">كود جديد</h2>
        <p className="mt-1.5 text-xs2 leading-relaxed text-ink-60">
          الخصم بيتحسب في السيرفر وقت تأكيد الأوردر — العميل مايقدرش يلعب فيه من
          المتصفح.
        </p>

        <Fields f={draft} on={setD} idp="c-new" />

        <button
          type="button"
          onClick={create}
          disabled={busy === 'add'}
          className="btn-solid mt-5 px-8"
        >
          {busy === 'add' ? 'بيتسجّل…' : 'أنشئ الكود'}
        </button>
      </section>

      {/* ── الأكواد الموجودة ── */}
      <section className="surface p-5 sm:p-6">
        <h2 className="font-display text-d1">الأكواد</h2>

        {rows.length === 0 ? (
          <p className="mt-4 text-xs1 text-ink-42">مافيش أكواد لسه.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>الكود</th>
                  <th>النوع</th>
                  <th className="text-end">القيمة</th>
                  <th className="text-end">أقل مجموع</th>
                  <th className="text-end">الاستخدام</th>
                  <th>المدة</th>
                  <th>الحالة</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const st = liveState(c);
                  return (
                    <tr key={c.id}>
                      <td className="num font-mark" dir="ltr">
                        {c.code}
                      </td>
                      <td className="text-xs2">{COUPON_KIND[c.kind]}</td>
                      <td className="num text-end">
                        {c.kind === 'percent'
                          ? `${num(c.value)}٪`
                          : c.kind === 'fixed'
                            ? egp(c.value)
                            : '—'}
                      </td>
                      <td className="num text-end">
                        {Number(c.min_subtotal) > 0 ? egp(c.min_subtotal) : '—'}
                      </td>
                      <td className="num text-end">
                        {num(c.used_count)}
                        {c.max_uses != null ? ` / ${num(c.max_uses)}` : ''}
                      </td>
                      <td className="text-xs2 text-ink-60">
                        {c.starts_at || c.ends_at ? (
                          <>
                            {c.starts_at ? dateAr(c.starts_at) : 'من الأول'}
                            {' → '}
                            {c.ends_at ? dateAr(c.ends_at) : 'مفتوح'}
                          </>
                        ) : (
                          'مفتوح'
                        )}
                      </td>
                      <td>
                        <span
                          className={`chip ${
                            st.tone === 'on'
                              ? 'bg-sage/12 text-sage border-sage/45'
                              : st.tone === 'wait'
                                ? 'bg-brass/12 text-brass border-brass/45'
                                : 'bg-glass text-ink-60 border-hair-soft'
                          }`}
                        >
                          {st.text}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-end">
                        <button
                          type="button"
                          onClick={() =>
                            setEditing({
                              ...c,
                              value: c.value ?? '',
                              min_subtotal: c.min_subtotal ?? '',
                              max_uses: c.max_uses ?? '',
                              starts_at: toDateInput(c.starts_at),
                              ends_at: toDateInput(c.ends_at),
                            })
                          }
                          className="btn-quiet"
                        >
                          عدّل
                        </button>
                        <button
                          type="button"
                          onClick={() => toggle(c)}
                          disabled={busy === c.id}
                          className="btn-quiet ms-2"
                        >
                          {c.is_active ? 'وقّف' : 'شغّل'}
                        </button>
                        {c.used_count === 0 ? (
                          <button
                            type="button"
                            onClick={() => remove(c)}
                            disabled={busy === c.id}
                            className="btn-quiet ms-2 text-garnet"
                          >
                            احذف
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <p className="mt-4 text-xs2 leading-relaxed text-ink-42">
              الكود اللي اتستخدم مرة على الأقل مافيش زرار حذف ليه — عشان
              الأوردرات القديمة تفضل مفهومة. وقّفه بدل الحذف.
            </p>
          </div>
        )}
      </section>

      {/* ── تعديل ── */}
      {editing ? (
        <section className="surface border-brass p-5 sm:p-6">
          <h2 className="font-display text-d1">
            تعديل <span className="num font-mark">{editing.code}</span>
          </h2>

          <Fields f={editing} on={setE} idp={`c-${editing.id}`} lockCode />

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveEdit}
              disabled={busy === editing.id}
              className="btn-solid px-8"
            >
              {busy === editing.id ? 'بيتسجّل…' : 'اسجّل'}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="btn-ghost">
              رجوع
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

/* حقول الكوبون — نفس الشكل في الإنشاء والتعديل */
function Fields({ f, on, idp, lockCode = false }) {
  return (
    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <label htmlFor={`${idp}-code`} className="label">الكود</label>
        <input
          id={`${idp}-code`}
          value={f.code}
          onChange={on('code')}
          readOnly={lockCode}
          required
          minLength={3}
          maxLength={24}
          pattern="[A-Z0-9-]+"
          dir="ltr"
          className="field text-start font-mark uppercase"
          placeholder="EID25"
        />
        {lockCode ? (
          <p className="mt-1 text-xs2 text-ink-42">الكود نفسه مايتغيّرش بعد الإنشاء.</p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${idp}-kind`} className="label">النوع</label>
        <select id={`${idp}-kind`} value={f.kind} onChange={on('kind')} required className="field">
          {Object.entries(COUPON_KIND).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${idp}-value`} className="label">
          {f.kind === 'percent'
            ? 'النسبة (٪)'
            : f.kind === 'fixed'
              ? 'المبلغ (ج.م)'
              : 'القيمة'}
        </label>
        <input
          id={`${idp}-value`}
          value={f.kind === 'free_ship' ? '' : f.value}
          onChange={on('value')}
          disabled={f.kind === 'free_ship'}
          required={f.kind !== 'free_ship'}
          min="0.1"
          max={f.kind === 'percent' ? '90' : undefined}
          step="any"
          inputMode="decimal"
          dir="ltr"
          className="field text-start"
          placeholder={f.kind === 'free_ship' ? 'الشحن بيبقى مجاني' : '10'}
        />
      </div>

      <div>
        <label htmlFor={`${idp}-min`} className="label">
          أقل مجموع للأوردر <span className="text-ink-42">(اختياري)</span>
        </label>
        <input
          id={`${idp}-min`}
          value={f.min_subtotal}
          onChange={on('min_subtotal')}
          min="0"
          step="any"
          inputMode="decimal"
          dir="ltr"
          className="field text-start"
          placeholder="0"
        />
      </div>

      <div>
        <label htmlFor={`${idp}-max`} className="label">
          أقصى عدد استخدامات <span className="text-ink-42">(سيبه فاضي = بلا حدود)</span>
        </label>
        <input
          id={`${idp}-max`}
          value={f.max_uses}
          onChange={on('max_uses')}
          min="1"
          step="1"
          inputMode="numeric"
          dir="ltr"
          className="field text-start"
        />
      </div>

      <div className="flex items-end">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={!!f.is_active}
            onChange={on('is_active')}
            className="accent-brass"
          />
          <span className="text-xs1">شغّال</span>
        </label>
      </div>

      <div>
        <label htmlFor={`${idp}-from`} className="label">يبدأ من</label>
        <input
          id={`${idp}-from`}
          type="date"
          value={f.starts_at}
          onChange={on('starts_at')}
          dir="ltr"
          className="field text-start"
        />
      </div>

      <div>
        <label htmlFor={`${idp}-to`} className="label">يخلص في</label>
        <input
          id={`${idp}-to`}
          type="date"
          value={f.ends_at}
          onChange={on('ends_at')}
          dir="ltr"
          className="field text-start"
        />
        <p className="mt-1 text-xs2 text-ink-42">آخر يوم بيشتغل لآخر الليل.</p>
      </div>
    </div>
  );
}
