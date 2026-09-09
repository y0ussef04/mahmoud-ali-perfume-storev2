'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FAMILY, FAMILY_ORDER, GENDER, SCALE_5 } from '@/lib/labels';
import { checkImageFile, slugify, toPositiveInt, toPositiveNumber } from '@/lib/validate';
import { egp } from '@/lib/money';

/* "مسك، عنبر" → ['مسك','عنبر'] — الفاصلة العربية والإنجليزية الاتنين */
const toList = (v) =>
  String(v || '')
    .split(/[،,]/)
    .map((s) => s.trim())
    .filter(Boolean);

const fromList = (a) => (Array.isArray(a) ? a.join('، ') : '');

const HEX = /^#[0-9a-fA-F]{6}$/;

export default function ProductForm({ product, brands }) {
  const router = useRouter();
  const isNew = !product;

  const [f, setF] = useState({
    name_ar: product?.name_ar || '',
    name_en: product?.name_en || '',
    slug: product?.slug || '',
    brand_id: product?.brand_id || '',
    family: product?.family || 'oud',
    kind: product?.kind || '',
    gender: product?.gender || 'unisex',
    concentration: product?.concentration || '',
    notes_top: fromList(product?.notes_top),
    notes_heart: fromList(product?.notes_heart),
    notes_base: fromList(product?.notes_base),
    spine_top: product?.spine_top || '#C9A45C',
    spine_heart: product?.spine_heart || '#8E3E44',
    spine_base: product?.spine_base || '#3A2318',
    longevity: product?.longevity || 3,
    projection: product?.projection || 3,
    description: product?.description || '',
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF((x) => ({ ...x, [k]: v }));
    setOk('');
  };

  const autoSlug = () => {
    const base = f.name_en?.trim() || f.name_ar?.trim();
    setF((x) => ({ ...x, slug: slugify(base) }));
  };

  async function save() {
    setError('');
    setOk('');

    if (!f.name_ar.trim()) return setError('اسم العطر بالعربي مطلوب.');
    if (!f.slug.trim()) return setError('الـ slug مطلوب — اضغط "اقترح" جنبه.');
    if (!f.brand_id) return setError('اختار البراند.');
    for (const k of ['spine_top', 'spine_heart', 'spine_base']) {
      if (!HEX.test(f[k])) return setError('ألوان عمود الرائحة لازم تكون بصيغة #RRGGBB.');
    }

    setBusy(true);

    const row = {
      name_ar: f.name_ar.trim(),
      name_en: f.name_en.trim() || null,
      slug: slugify(f.slug),
      brand_id: f.brand_id,
      family: f.family,
      kind: f.kind.trim() || null,
      gender: f.gender,
      concentration: f.concentration.trim() || null,
      notes_top: toList(f.notes_top),
      notes_heart: toList(f.notes_heart),
      notes_base: toList(f.notes_base),
      spine_top: f.spine_top,
      spine_heart: f.spine_heart,
      spine_base: f.spine_base,
      longevity: toPositiveInt(f.longevity, 3) || 3,
      projection: toPositiveInt(f.projection, 3) || 3,
      description: f.description.trim() || null,
      is_active: f.is_active,
      is_featured: f.is_featured,
    };

    try {
      const supabase = createClient();

      if (isNew) {
        const { data, error: dbError } = await supabase
          .from('products')
          .insert(row)
          .select('id')
          .single();

        if (dbError) throw dbError;
        router.replace(`/admin/products/${data.id}`);
        router.refresh();
        return;
      }

      const { error: dbError } = await supabase
        .from('products')
        .update(row)
        .eq('id', product.id);

      if (dbError) throw dbError;

      setOk('اتسجّل. المتجر بيحدّث نفسه في حدود دقيقة.');
      router.refresh();
    } catch (e) {
      setError(
        e?.code === '23505' || /duplicate/i.test(e?.message || '')
          ? 'الـ slug ده مستخدم في عطر تاني. غيّره.'
          : e?.message || 'مانفعش يتسجّل.'
      );
    } finally {
      setBusy(false);
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

      {/* ── الهوية ── */}
      <section className="surface p-5 sm:p-6">
        <h2 className="font-display text-d1">الهوية</h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-ar" className="label">الاسم بالعربي</label>
            <input id="pf-ar" value={f.name_ar} onChange={set('name_ar')} required minLength={2} className="field" />
          </div>

          <div>
            <label htmlFor="pf-en" className="label">الاسم بالإنجليزي</label>
            <input
              id="pf-en"
              value={f.name_en}
              onChange={set('name_en')}
              dir="ltr"
              className="field text-start"
            />
          </div>

          <div>
            <label htmlFor="pf-slug" className="label">
              slug <span className="text-ink-42">(اللي بيظهر في اللينك)</span>
            </label>
            <div className="flex gap-2">
              <input
                id="pf-slug"
                value={f.slug}
                onChange={set('slug')}
                required
                minLength={2}
                pattern="[a-z0-9-]+"
                dir="ltr"
                className="field text-start font-mark"
              />
              <button type="button" onClick={autoSlug} className="btn-ghost shrink-0">
                توليد تلقائي
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="pf-brand" className="label">دار العطور (الماركة)</label>
            <select id="pf-brand" value={f.brand_id} onChange={set('brand_id')} required className="field">
              <option value="">اختر الماركة</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name_ar} ({b.country === 'AE' ? 'الإمارات' : 'السعودية'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pf-family" className="label">العائلة العطرية</label>
            <select id="pf-family" value={f.family} onChange={set('family')} required className="field">
              {FAMILY_ORDER.map((k) => (
                <option key={k} value={k}>{FAMILY[k]}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pf-gender" className="label">الفئة المستهدفة</label>
            <select id="pf-gender" value={f.gender} onChange={set('gender')} required className="field">
              {Object.entries(GENDER).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pf-kind" className="label">
              النوع <span className="text-ink-42">(دهن عود · مخلط شرقي · بخور)</span>
            </label>
            <input id="pf-kind" value={f.kind} onChange={set('kind')} className="field" />
          </div>

          <div>
            <label htmlFor="pf-conc" className="label">
              التركيز <span className="text-ink-42">(EDP · دهن معتّق)</span>
            </label>
            <input
              id="pf-conc"
              value={f.concentration}
              onChange={set('concentration')}
              className="field"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="pf-desc" className="label">الوصف</label>
            <textarea
              id="pf-desc"
              value={f.description}
              onChange={set('description')}
              rows={4}
              className="field"
              placeholder="اكتب زي ما بتحكي لعميل واقف قصادك — إيه ريحته وامتى يلبسه"
            />
          </div>
        </div>
      </section>

      {/* ── النوتات وعمود الرائحة ── */}
      <section className="surface p-5 sm:p-6">
        <h2 className="font-display text-d1">النوتات وعمود الرائحة</h2>
        <p className="mt-1.5 text-xs2 leading-relaxed text-ink-60">
          اكتب النوتات بفواصل. الألوان التلاتة هي الشريط الرأسي اللي بيظهر جنب
          العطر في المتجر — خلّي كل لون قريب من إحساس النوتة نفسها.
        </p>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto]">
          <div className="space-y-5">
            {[
              ['notes_top', 'المقدمة', 'spine_top', 'برغموت، ليمون'],
              ['notes_heart', 'القلب', 'spine_heart', 'ورد طائفي، زعفران'],
              ['notes_base', 'القاعدة', 'spine_base', 'عود، عنبر، مسك'],
            ].map(([nk, label, ck, ph]) => (
              <div key={nk} className="flex items-end gap-3">
                <div className="flex-1">
                  <label htmlFor={`pf-${nk}`} className="label">{label}</label>
                  <input
                    id={`pf-${nk}`}
                    value={f[nk]}
                    onChange={set(nk)}
                    className="field"
                    placeholder={ph}
                  />
                </div>
                <div>
                  <label htmlFor={`pf-${ck}`} className="label">اللون</label>
                  <input
                    id={`pf-${ck}`}
                    type="color"
                    value={HEX.test(f[ck]) ? f[ck] : '#000000'}
                    onChange={set(ck)}
                    className="h-[2.9rem] w-14 cursor-pointer border border-hair bg-elevated p-1"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* معاينة العمود */}
          <div className="flex items-stretch gap-3">
            <div
              aria-hidden="true"
              className="w-1.5"
              style={{
                background: `linear-gradient(to bottom, ${f.spine_top} 0 33.33%, ${f.spine_heart} 33.33% 66.66%, ${f.spine_base} 66.66% 100%)`,
              }}
            />
            <p className="self-center text-xs2 tracking-wide2 text-ink-42">معاينة</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-long" className="label">الثبات</label>
            <select id="pf-long" value={f.longevity} onChange={set('longevity')} className="field">
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} — {SCALE_5[n]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pf-proj" className="label">الفوحان</label>
            <select id="pf-proj" value={f.projection} onChange={set('projection')} className="field">
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} — {SCALE_5[n]}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── العرض ── */}
      <section className="surface p-5 sm:p-6">
        <h2 className="font-display text-d1">العرض في المتجر</h2>

        <div className="mt-4 space-y-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={f.is_active}
              onChange={set('is_active')}
              className="mt-1 accent-brass"
            />
            <span>
              <span className="block text-xs1">معروض للبيع</span>
              <span className="block text-xs2 text-ink-42">
                لو شيلت العلامة، العطر يختفي من المتجر بس بياناته وأوردراته تفضل
                زي ما هي.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={f.is_featured}
              onChange={set('is_featured')}
              className="mt-1 accent-brass"
            />
            <span>
              <span className="block text-xs1">مميّز</span>
              <span className="block text-xs2 text-ink-42">
                يظهر في الصفحة الرئيسية.
              </span>
            </span>
          </label>
        </div>
      </section>

      {/* ── الحفظ ── */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className="btn-solid px-8">
          {busy ? 'جاري الحفظ…' : isNew ? 'إنشاء العطر' : 'حفظ التعديلات'}
        </button>
        <Link href="/admin/products" className="btn-ghost">رجوع</Link>

        {isNew ? (
          <p className="text-xs2 text-ink-42">
            بعد الإنشاء هتقدر تضيف الأحجام والأسعار والصور.
          </p>
        ) : null}
      </div>

      {/* ── الأحجام والصور — بعد ما العطر يبقى موجود ── */}
      {!isNew ? (
        <>
          <VariantEditor productId={product.id} initial={product.variants || []} />
          <ImageEditor productId={product.id} initial={product.images || []} />
          <DangerZone product={product} />
        </>
      ) : null}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   الأحجام والأسعار والمخزون
   ══════════════════════════════════════════════════════════ */
function VariantEditor({ productId, initial }) {
  const router = useRouter();
  const [rows, setRows] = useState(
    [...initial].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
  );
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const blank = {
    label: '',
    ml: '',
    price: '',
    compare_price: '',
    stock: 0,
    sku: '',
    sort: rows.length,
    is_active: true,
  };
  const [draft, setDraft] = useState(blank);

  const setDraftField = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setDraft((d) => ({ ...d, [k]: v }));
  };

  function patchRow(id, patch) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch, _dirty: true } : r)));
    setOk('');
  }

  async function addRow() {
    setError('');
    setOk('');
    if (!draft.label.trim()) return setError('اكتب اسم الحجم — زي "100 مل".');
    // toPositiveNumber بترجع 0 للنص الفاضي، فبنطلب سعر أكبر من صفر بصراحة
    if (toPositiveNumber(draft.price) <= 0) return setError('السعر مطلوب ولازم يكون أكبر من صفر.');

    setBusy('add');
    try {
      const supabase = createClient();
      const { data, error: dbError } = await supabase
        .from('variants')
        .insert({
          product_id: productId,
          label: draft.label.trim(),
          ml: draft.ml === '' ? null : toPositiveNumber(draft.ml),
          price: toPositiveNumber(draft.price),
          compare_price:
            draft.compare_price === '' ? null : toPositiveNumber(draft.compare_price),
          stock: toPositiveInt(draft.stock),
          sku: draft.sku.trim() || null,
          sort: rows.length,
          is_active: draft.is_active,
        })
        .select('*')
        .single();

      if (dbError) throw dbError;

      setRows((rs) => [...rs, data]);
      setDraft({ ...blank, sort: rows.length + 1 });
      setOk('الحجم اتضاف.');
      router.refresh();
    } catch (e) {
      setError(
        /duplicate/i.test(e?.message || '') ? 'الـ SKU ده مستخدم قبل كده.' : e?.message
      );
    } finally {
      setBusy('');
    }
  }

  async function saveRow(row) {
    setError('');
    setOk('');
    if (!String(row.label || '').trim()) return setError('اسم الحجم مايصحّ يبقى فاضي.');
    if (toPositiveNumber(row.price) <= 0)
      return setError('السعر لازم يكون أكبر من صفر — لو عايز تخفيه شيل علامة "معروض".');

    setBusy(row.id);
    try {
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from('variants')
        .update({
          label: String(row.label || '').trim(),
          ml: row.ml === '' || row.ml == null ? null : toPositiveNumber(row.ml),
          price: toPositiveNumber(row.price),
          compare_price:
            row.compare_price === '' || row.compare_price == null
              ? null
              : toPositiveNumber(row.compare_price),
          stock: toPositiveInt(row.stock),
          sku: String(row.sku || '').trim() || null,
          is_active: !!row.is_active,
        })
        .eq('id', row.id);

      if (dbError) throw dbError;

      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, _dirty: false } : r)));
      setOk('اتسجّل.');
      router.refresh();
    } catch (e) {
      setError(e?.message || 'مانفعش يتسجّل.');
    } finally {
      setBusy('');
    }
  }

  async function removeRow(row) {
    setBusy(row.id);
    setError('');
    try {
      const supabase = createClient();
      const { error: dbError } = await supabase.from('variants').delete().eq('id', row.id);
      if (dbError) throw dbError;
      setRows((rs) => rs.filter((r) => r.id !== row.id));
      router.refresh();
    } catch (e) {
      setError(
        /foreign key|violates/i.test(e?.message || '')
          ? 'الحجم ده مرتبط بأوردرات قديمة. شيل علامة "معروض" بدل ما تحذفه.'
          : e?.message
      );
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="surface p-5 sm:p-6">
      <h2 className="font-display text-d1">الأحجام والأسعار والمخزون</h2>
      <p className="mt-1.5 text-xs2 leading-relaxed text-ink-60">
        كل حجم سطر لوحده. السعر اللي هنا هو اللي بيتحسب في الأوردر — مافيش أسعار
        بتتحسب في المتصفح.
      </p>

      {error ? (
        <p role="alert" className="mt-4 border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="mt-4 border border-sage bg-sage/8 px-4 py-2.5 text-xs2 text-sage">{ok}</p>
      ) : null}

      <div className="mt-5 overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>الحجم</th>
              <th className="w-20">مل</th>
              <th className="w-28">السعر</th>
              <th className="w-28">قبل الخصم</th>
              <th className="w-20">المخزون</th>
              <th className="w-32">SKU</th>
              <th className="w-16">معروض</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <input
                    value={r.label || ''}
                    onChange={(e) => patchRow(r.id, { label: e.target.value })}
                    className="field"
                    aria-label="اسم الحجم"
                  />
                </td>
                <td>
                  <input
                    value={r.ml ?? ''}
                    onChange={(e) => patchRow(r.id, { ml: e.target.value })}
                    inputMode="decimal"
                    dir="ltr"
                    className="field text-start"
                    aria-label="مل"
                  />
                </td>
                <td>
                  <input
                    value={r.price ?? ''}
                    onChange={(e) => patchRow(r.id, { price: e.target.value })}
                    inputMode="decimal"
                    dir="ltr"
                    className="field text-start"
                    aria-label="السعر"
                  />
                </td>
                <td>
                  <input
                    value={r.compare_price ?? ''}
                    onChange={(e) => patchRow(r.id, { compare_price: e.target.value })}
                    inputMode="decimal"
                    dir="ltr"
                    className="field text-start"
                    aria-label="السعر قبل الخصم"
                  />
                </td>
                <td>
                  <input
                    value={r.stock ?? 0}
                    onChange={(e) => patchRow(r.id, { stock: e.target.value })}
                    inputMode="numeric"
                    dir="ltr"
                    className="field text-start"
                    aria-label="المخزون"
                  />
                </td>
                <td>
                  <input
                    value={r.sku || ''}
                    onChange={(e) => patchRow(r.id, { sku: e.target.value })}
                    dir="ltr"
                    className="field text-start font-mark"
                    aria-label="SKU"
                  />
                </td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={!!r.is_active}
                    onChange={(e) => patchRow(r.id, { is_active: e.target.checked })}
                    className="accent-brass"
                    aria-label="معروض"
                  />
                </td>
                <td className="whitespace-nowrap text-end">
                  <button
                    type="button"
                    onClick={() => saveRow(r)}
                    disabled={busy === r.id || !r._dirty}
                    className="btn-quiet"
                  >
                    {busy === r.id ? '…' : 'سجّل'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRow(r)}
                    disabled={busy === r.id}
                    className="btn-quiet ms-2 text-garnet"
                  >
                    احذف
                  </button>
                </td>
              </tr>
            ))}

            {/* سطر الإضافة */}
            <tr className="bg-brass/6">
              <td>
                <input
                  value={draft.label}
                  onChange={setDraftField('label')}
                  className="field"
                  placeholder="100 مل"
                  aria-label="حجم جديد"
                />
              </td>
              <td>
                <input
                  value={draft.ml}
                  onChange={setDraftField('ml')}
                  inputMode="decimal"
                  dir="ltr"
                  className="field text-start"
                  placeholder="100"
                  aria-label="مل"
                />
              </td>
              <td>
                <input
                  value={draft.price}
                  onChange={setDraftField('price')}
                  inputMode="decimal"
                  dir="ltr"
                  className="field text-start"
                  placeholder="850"
                  aria-label="السعر"
                />
              </td>
              <td>
                <input
                  value={draft.compare_price}
                  onChange={setDraftField('compare_price')}
                  inputMode="decimal"
                  dir="ltr"
                  className="field text-start"
                  aria-label="السعر قبل الخصم"
                />
              </td>
              <td>
                <input
                  value={draft.stock}
                  onChange={setDraftField('stock')}
                  inputMode="numeric"
                  dir="ltr"
                  className="field text-start"
                  aria-label="المخزون"
                />
              </td>
              <td>
                <input
                  value={draft.sku}
                  onChange={setDraftField('sku')}
                  dir="ltr"
                  className="field text-start font-mark"
                  aria-label="SKU"
                />
              </td>
              <td className="text-center">
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={setDraftField('is_active')}
                  className="accent-brass"
                  aria-label="معروض"
                />
              </td>
              <td className="text-end">
                <button
                  type="button"
                  onClick={addRow}
                  disabled={busy === 'add'}
                  className="btn-solid"
                >
                  {busy === 'add' ? '…' : 'ضيف'}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {rows.length > 0 ? (
        <p className="num mt-4 text-xs2 text-ink-42">
          أرخص حجم:{' '}
          {egp(
            Math.min(
              ...rows
                .filter((r) => r.is_active)
                .map((r) => Number(r.price) || Infinity)
                .concat(Infinity)
            ) || 0
          )}
        </p>
      ) : null}
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   الصور
   ══════════════════════════════════════════════════════════ */
function ImageEditor({ productId, initial }) {
  const router = useRouter();
  const [images, setImages] = useState(
    [...initial].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
  );
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function upload(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    setError('');
    setBusy('up');

    try {
      const supabase = createClient();

      for (const file of files) {
        const bad = checkImageFile(file);
        if (bad) throw new Error(`${file.name}: ${bad}`);

        const ext =
          (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') ||
          'jpg';
        const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('products')
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from('products').getPublicUrl(path);

        const { data: row, error: dbErr } = await supabase
          .from('product_images')
          .insert({ product_id: productId, url: pub.publicUrl, sort: images.length })
          .select('*')
          .single();
        if (dbErr) throw dbErr;

        setImages((xs) => [...xs, row]);
      }

      router.refresh();
    } catch (err) {
      setError(err?.message || 'الرفع مانفعش.');
    } finally {
      setBusy('');
    }
  }

  async function remove(img) {
    setBusy(img.id);
    setError('');
    try {
      const supabase = createClient();

      const { error: dbErr } = await supabase
        .from('product_images')
        .delete()
        .eq('id', img.id);
      if (dbErr) throw dbErr;

      // نشيل الملف كمان لو قدرنا نطلّع مساره من الرابط
      const path = String(img.url || '').split('/object/public/products/')[1];
      if (path) await supabase.storage.from('products').remove([path]);

      setImages((xs) => xs.filter((x) => x.id !== img.id));
      router.refresh();
    } catch (err) {
      setError(err?.message || 'الحذف مانفعش.');
    } finally {
      setBusy('');
    }
  }

  /** وصف الصورة — بيتسجّل لما تسيب الحقل */
  async function saveAlt(img, alt) {
    if ((img.alt || '') === alt.trim()) return;
    try {
      const supabase = createClient();
      await supabase
        .from('product_images')
        .update({ alt: alt.trim() || null })
        .eq('id', img.id);
      setImages((xs) =>
        xs.map((x) => (x.id === img.id ? { ...x, alt: alt.trim() || null } : x))
      );
    } catch (err) {
      setError(err?.message || 'وصف الصورة مانفعش يتسجّل.');
    }
  }

  async function move(img, dir) {
    const i = images.findIndex((x) => x.id === img.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= images.length) return;

    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    setImages(next);
    setBusy(img.id);

    try {
      const supabase = createClient();
      await Promise.all(
        next.map((x, idx) =>
          supabase.from('product_images').update({ sort: idx }).eq('id', x.id)
        )
      );
      router.refresh();
    } catch (err) {
      setError(err?.message || 'الترتيب مانفعش.');
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="surface p-5 sm:p-6">
      <h2 className="font-display text-d1">الصور</h2>
      <p className="mt-1.5 text-xs2 leading-relaxed text-ink-60">
        أول صورة هي اللي تظهر في الكاتالوج. الأفضل صورة مربّعة على خلفية فاتحة،
        أقل من ٤ ميجا.
      </p>

      {error ? (
        <p role="alert" className="mt-4 border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet">
          {error}
        </p>
      ) : null}

      {images.length > 0 ? (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <li key={img.id} className="border border-hair-soft bg-elevated">
              {/* صور Supabase بتتحمّل من دومين خارجي — img عادية أبسط من next/image هنا */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt || ''}
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
              <div className="flex items-center justify-between gap-2 border-t border-hair-soft px-3 py-2">
                <span className="text-xs2 text-ink-42">
                  {i === 0 ? 'الصورة الأساسية' : `صورة ${i + 1}`}
                </span>
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(img, -1)}
                    disabled={i === 0 || !!busy}
                    className="btn-quiet"
                    aria-label="حرّكها لبدري"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(img, 1)}
                    disabled={i === images.length - 1 || !!busy}
                    className="btn-quiet"
                    aria-label="حرّكها لبعدين"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(img)}
                    disabled={!!busy}
                    className="btn-quiet text-garnet"
                  >
                    احذف
                  </button>
                </span>
              </div>

              <div className="border-t border-hair-soft px-3 py-2">
                <label htmlFor={`img-alt-${img.id}`} className="sr-only">
                  وصف الصورة
                </label>
                <input
                  id={`img-alt-${img.id}`}
                  defaultValue={img.alt || ''}
                  onBlur={(e) => saveAlt(img, e.target.value)}
                  placeholder="وصف مختصر للصورة (للسيو وقارئ الشاشة)"
                  className="w-full border-0 bg-transparent p-0 text-xs2 text-ink-60
                             placeholder:text-ink-42 focus:outline-none"
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <label className="mt-5 flex cursor-pointer items-center justify-between gap-3 border border-dashed border-hair bg-elevated px-4 py-4">
        <span className="text-xs1 text-ink-60">
          {busy === 'up' ? 'بيرفع…' : 'اختار صورة أو أكتر'}
        </span>
        <span className="btn-ghost shrink-0">تصفّح</span>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={upload}
          disabled={busy === 'up'}
          className="sr-only"
        />
      </label>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   الحذف — آخر حاجة وبتحذير
   ══════════════════════════════════════════════════════════ */
function DangerZone({ product }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function destroy() {
    setBusy(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);
      if (dbError) throw dbError;

      router.replace('/admin/products');
      router.refresh();
    } catch (e) {
      // الداتابيز بتمنع حذف عطر ليه أوردرات قديمة (on delete restrict)
      // عشان تاريخ الأوردرات وإرجاع المخزون يفضلوا سليمين
      setError(
        /foreign key|violates/i.test(e?.message || '')
          ? 'العطر ده عليه أوردرات قديمة فمينفعش يتحذف. شيل علامة "معروض للبيع" وهو هيختفي من المتجر.'
          : e?.message || 'الحذف مانفعش.'
      );
      setBusy(false);
    }
  }

  return (
    <section className="border border-garnet/40 p-5 sm:p-6">
      <h2 className="font-display text-d1 text-garnet">حذف نهائي</h2>
      <p className="mt-1.5 text-xs2 leading-relaxed text-ink-60">
        الأفضل تشيل علامة «معروض للبيع» بدل الحذف — كده العطر يختفي من المتجر
        وتحليلاته وأوردراته القديمة تفضل سليمة. الحذف بيمسح الأحجام والصور معاه.
      </p>

      {error ? (
        <p role="alert" className="mt-4 border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet">
          {error}
        </p>
      ) : null}

      {confirming ? (
        <div className="mt-4">
          <label htmlFor="pf-del" className="label">
            اكتب <span className="font-mark">{product.slug}</span> للتأكيد
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="pf-del"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              dir="ltr"
              className="field text-start font-mark"
            />
            <button
              type="button"
              onClick={destroy}
              disabled={busy || typed.trim() !== product.slug}
              className="btn-solid shrink-0"
            >
              {busy ? 'بيتحذف…' : 'احذف نهائي'}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setTyped('');
              }}
              className="btn-ghost shrink-0"
            >
              رجوع
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="btn-ghost mt-4 text-garnet"
        >
          احذف العطر ده
        </button>
      )}
    </section>
  );
}
