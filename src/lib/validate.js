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
