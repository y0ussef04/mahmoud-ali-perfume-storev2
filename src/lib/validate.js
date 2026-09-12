// ══════════════════════════════════════════════════════════
//  التحقق من البيانات — نفس القواعد بالحرف اللي في place_order
//  الواجهة بتتحقق للسرعة، والسيرفر بيتحقق للأمان
// ══════════════════════════════════════════════════════════

/** موبايل مصري: 010 / 011 / 012 / 015 + ٨ أرقام */
export const EG_PHONE = /^01[0125][0-9]{8}$/;

/** بيشيل المسافات والشرطات وبيحوّل الأرقام العربية للاتينية */
export function normalizePhone(v) {
  if (!v) return '';
  return String(v)
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[^\d]/g, '');
}

export function isPhone(v) {
  return EG_PHONE.test(normalizePhone(v));
}

/**
 * التحقق من بيانات الشحن.
 * @returns {Object} كائن أخطاء — فاضي معناه كله تمام
 */
export function validateShipping(f) {
  const e = {};

  const name = (f.name || '').trim();
  if (!name) e.name = 'اكتب الاسم بالكامل.';
  else if (name.length < 4) e.name = 'الاسم قصير — اكتب الاسم الثنائي على الأقل.';
  else if (!/\s/.test(name)) e.name = 'محتاجين اسمين على الأقل عشان المندوب يوصلك.';

  if (!f.phone) e.phone = 'الموبايل مطلوب — المندوب هيتصل بيه.';
  else if (!isPhone(f.phone)) e.phone = 'الرقم مش صحيح. المفروض ١١ رقم يبدأ بـ 010 أو 011 أو 012 أو 015.';

  if (f.phone2 && !isPhone(f.phone2)) e.phone2 = 'الرقم الاحتياطي مش صحيح.';
  else if (f.phone2 && normalizePhone(f.phone2) === normalizePhone(f.phone))
    e.phone2 = 'الرقم الاحتياطي زي الأساسي — سيبه فاضي أو حُطّ رقم تاني.';

  if (!f.governorate) e.governorate = 'اختار المحافظة.';

  const area = (f.area || '').trim();
  if (!area) e.area = 'المدينة أو الحي مطلوب.';
  else if (area.length < 2) e.area = 'اكتب اسم المنطقة كامل.';

  const street = (f.street || '').trim();
  if (!street) e.street = 'العنوان مطلوب.';
  else if (street.length < 8)
    e.street = 'العنوان قصير — اكتب الشارع ورقم العمارة والدور.';

  return e;
}

/** التحقق من بيانات التحويل (إنستاباي / فودافون كاش) */
export function validateTransfer(f) {
  const e = {};
  const ref = (f.transferRef || '').trim();
  if (!ref) e.transferRef = 'اكتب آخر ٤ أرقام من رقم العملية أو رقم المحفظة اللي حوّلت منها.';
  else if (ref.length < 4) e.transferRef = 'محتاجين ٤ خانات على الأقل.';
  if (!f.receipt) e.receipt = 'ارفع صورة إيصال التحويل.';
  return e;
}

export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024; // 5 ميجا
export const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

/** @returns {string|null} رسالة خطأ أو null */
export function checkReceiptFile(file) {
  if (!file) return 'مفيش ملف مختار.';
  if (!RECEIPT_TYPES.includes(file.type))
    return 'الملف لازم يكون صورة (JPG أو PNG أو WEBP) أو PDF.';
  if (file.size > RECEIPT_MAX_BYTES) return 'حجم الملف أكبر من ٥ ميجا. اضغطه أو صوّره تاني.';
  return null;
}

export const IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export function checkImageFile(file) {
  if (!file) return 'مفيش ملف مختار.';
  if (!IMAGE_TYPES.includes(file.type)) return 'الصورة لازم تكون JPG أو PNG أو WEBP أو AVIF.';
  if (file.size > IMAGE_MAX_BYTES) return 'حجم الصورة أكبر من ٤ ميجا.';
  return null;
}

/** slug آمن من اسم عربي أو إنجليزي */
export function slugify(v) {
  return String(v || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** أرقام موجبة بس — للحقول المالية */
export function toPositiveNumber(v, fallback = 0) {
  const n = Number(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function toPositiveInt(v, fallback = 0) {
  const n = parseInt(String(v ?? '').replace(/,/g, ''), 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// ══════════════════════════════════════════════════════════
//  دوال التحقق الصارم وحماية الاستعلامات (Guardrail Validators)
// ══════════════════════════════════════════════════════════

/**
 * تنقية استعلامات البحث الموجهة إلى PostgREST ومصفوفات .or(...)
 * تدعم وتحافظ على اللغة العربية بالكامل، الحروف اللاتينية، الأرقام، المسافات،
 * وعلامات الترقيم الطبيعية في أسماء العطور مثل & و - و /
 * وتمنع تماماً محارف كسر بناء جمل PostgREST مثل الفواصل والأقواس وعلامات التنصيص والنسبة المئوية.
 */
export function safePostgrestSearch(v, maxLen = 60) {
  if (!v) return '';
  return String(v)
    .replace(/[\0\x00-\x1F\x7F]/g, '') // إزالة محارف التحكم الخفية والـ Null Bytes
    .replace(/[,()"'\\;%`]/g, ' ')      // استبدال محارف كسر الجمل بمسافة
    .replace(/\s+/g, ' ')               // توحيد المسافات المتعددة
    .trim()
    .slice(0, maxLen);
}

export const safeSearch = safePostgrestSearch;

/**
 * فحص صارم للأرقام الموجبة (يرفض القيم السالبة والـ NaN والـ Infinity بدلاً من تحويلها صامتاً).
 */
export function parseStrictPositiveNumber(v, fieldName = 'الحقل', { allowZero = true, max = 1000000 } = {}) {
  if (v === '' || v === null || v === undefined) return null;
  const raw = String(v).replace(/,/g, '').trim();
  const n = Number(raw);
  if (!Number.isFinite(n) || isNaN(n)) {
    throw new Error(`${fieldName} يجب أن يكون رقماً صالحاً.`);
  }
  if (allowZero ? n < 0 : n <= 0) {
    throw new Error(`${fieldName} يجب أن يكون رقماً ${allowZero ? 'أكبر من أو يساوي الصفر' : 'أكبر من الصفر'}.`);
  }
  if (n > max) {
    throw new Error(`${fieldName} تجاوز الحد الأقصى المسموح به (${max}).`);
  }
  return n;
}

/**
 * فحص صارم للأعداد الصحيحة (يرفض الكسور والقيم السالبة).
 */
export function parseStrictPositiveInt(v, fieldName = 'الحقل', { allowZero = true, max = 1000000 } = {}) {
  if (v === '' || v === null || v === undefined) return null;
  const raw = String(v).replace(/,/g, '').trim();
  if (!/^-?\d+$/.test(raw)) {
    throw new Error(`${fieldName} يجب أن يكون عدداً صحيحاً بدون كسور.`);
  }
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || isNaN(n)) {
    throw new Error(`${fieldName} يجب أن يكون عدداً صحيحاً صالحاً.`);
  }
  if (allowZero ? n < 0 : n <= 0) {
    throw new Error(`${fieldName} يجب أن يكون ${allowZero ? 'صفراً أو عدداً موجباً' : 'عدداً موجباً أكبر من الصفر'}.`);
  }
  if (n > max) {
    throw new Error(`${fieldName} تجاوز الحد الأقصى المسموح به (${max}).`);
  }
  return n;
}

/**
 * فحص بيانات المتغيرات والأحجام (Variant) مع رفض الأخطاء صراحة.
 */
export function validateVariantData(draft) {
  const label = String(draft?.label || '').trim();
  if (!label) throw new Error('اسم الحجم مطلوب — مثال: "100 مل".');
  if (label.length > 80) throw new Error('اسم الحجم طويل جداً (الحد الأقصى 80 حرفاً).');

  const price = parseStrictPositiveNumber(draft?.price, 'سعر البيع', { allowZero: false });
  if (price == null) throw new Error('سعر البيع مطلوب ولا يمكن تركه فارغاً.');

  const comparePrice = parseStrictPositiveNumber(draft?.compare_price, 'السعر قبل الخصم', { allowZero: false });
  if (comparePrice != null && comparePrice <= price) {
    throw new Error('السعر قبل الخصم يجب أن يكون أعلى من سعر البيع الفعلي.');
  }

  const stock = parseStrictPositiveInt(draft?.stock ?? 0, 'المخزون', { allowZero: true });
  if (stock == null) throw new Error('كمية المخزون مطلوبة.');

  const ml = parseStrictPositiveNumber(draft?.ml, 'الحجم بالملي', { allowZero: false, max: 5000 });

  return {
    label,
    price,
    compare_price: comparePrice,
    stock,
    ml,
    sku: draft?.sku ? String(draft.sku).trim().slice(0, 60) : null,
    is_active: draft?.is_active !== false,
  };
}

/**
 * فحص بيانات الكوبونات.
 */
export function validateCouponData(f) {
  const code = String(f?.code || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '');

  if (code.length < 3) throw new Error('رمز الكوبون قصير — ٣ أحرف أو أرقام على الأقل.');
  if (code.length > 30) throw new Error('رمز الكوبون لا يمكن أن يتجاوز 30 حرفاً.');

  const kind = f?.kind;
  if (!['percent', 'fixed', 'free_ship'].includes(kind)) {
    throw new Error('نوع الكوبون غير صالح.');
  }

  let value = 0;
  if (kind === 'percent') {
    value = parseStrictPositiveNumber(f?.value, 'نسبة الخصم', { allowZero: false, max: 90 });
    if (value <= 0 || value > 90) throw new Error('نسبة الخصم يجب أن تكون بين 1 و 90٪.');
  } else if (kind === 'fixed') {
    value = parseStrictPositiveNumber(f?.value, 'قيمة الخصم', { allowZero: false });
    if (value <= 0) throw new Error('قيمة الخصم يجب أن تكون أكبر من الصفر.');
  }

  const minSubtotal = parseStrictPositiveNumber(f?.min_subtotal || 0, 'الحد الأدنى للطلب', { allowZero: true }) || 0;
  const maxUses = parseStrictPositiveInt(f?.max_uses, 'أقصى عدد استخدامات', { allowZero: false });

  let startsAt = null;
  let endsAt = null;
  if (f?.starts_at) {
    const s = new Date(f.starts_at);
    if (isNaN(s.getTime())) throw new Error('تاريخ بداية الكوبون غير صالح.');
    startsAt = s.toISOString();
  }
  if (f?.ends_at) {
    const e = new Date(f.ends_at);
    if (isNaN(e.getTime())) throw new Error('تاريخ نهاية الكوبون غير صالح.');
    endsAt = e.toISOString();
  }
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
    throw new Error('تاريخ نهاية الكوبون يجب أن يكون بعد تاريخ البداية.');
  }

  return {
    code,
    kind,
    value,
    min_subtotal: minSubtotal,
    max_uses: maxUses,
    starts_at: startsAt,
    ends_at: endsAt,
    is_active: f?.is_active !== false,
  };
}
