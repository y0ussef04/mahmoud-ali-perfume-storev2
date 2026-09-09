// ══════════════════════════════════════════════════════════
//  التسميات العربية — مصدر واحد للحقيقة عبر الموقع كله
//  المفاتيح لازم تطابق قيود CHECK في schema.sql بالحرف
// ══════════════════════════════════════════════════════════

export const ORDER_STATUS = {
  new: 'جديد',
  confirmed: 'مؤكّد',
  packed: 'مجهّز',
  shipped: 'مع المندوب',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
  returned: 'مرتجع',
};

/** لون الشريحة لكل حالة — [خلفية، نص، حدود] */
export const STATUS_STYLE = {
  new: 'bg-brass/12 text-brass border-brass/45',
  confirmed: 'bg-sage/12 text-sage border-sage/45',
  packed: 'bg-sage/16 text-sage border-sage/55',
  shipped: 'bg-lacquer text-brass-gilt border-lacquer',
  delivered: 'bg-success-solid text-white border-success-solid',
  cancelled: 'bg-garnet/12 text-garnet border-garnet/45',
  returned: 'bg-garnet/20 text-garnet border-garnet/60',
};

/** التحوّلات المسموح بها — بتمنع الأدمن من رجوع حالة بالغلط */
export const STATUS_NEXT = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned', 'cancelled'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

export const PAYMENT_METHOD = {
  cod: 'دفع عند الاستلام',
  card: 'لينك دفع (كارت أو محفظة)',
  wallet: 'إنستاباي / فودافون كاش',
};

export const PAYMENT_METHOD_SHORT = {
  cod: 'عند الاستلام',
  card: 'لينك دفع',
  wallet: 'تحويل',
};

export const PAYMENT_STATUS = {
  unpaid: 'لم يُدفع',
  pending_review: 'في انتظار المراجعة',
  paid: 'مدفوع',
  refunded: 'مُسترد',
};

export const PAYMENT_STATUS_STYLE = {
  unpaid: 'bg-glass text-ink-60 border-hair-soft',
  pending_review: 'bg-brass/14 text-brass border-brass/50',
  paid: 'bg-success-solid text-white border-success-solid',
  refunded: 'bg-garnet/12 text-garnet border-garnet/45',
};

export const FAMILY = {
  oud: 'عود',
  oriental: 'شرقي ومخلط',
  floral: 'زهري',
  musk: 'مسك',
  citrus: 'حمضي منعش',
  oil: 'دهن وزيوت',
  incense: 'بخور ومعمول',
  set: 'أطقم وعيّنات',
};

/** ترتيب عرض العائلات في الفلاتر — من الأشهر للأقل */
export const FAMILY_ORDER = [
  'oud',
  'oriental',
  'floral',
  'musk',
  'citrus',
  'oil',
  'incense',
  'set',
];

export const GENDER = {
  men: 'رجالي',
  women: 'نسائي',
  unisex: 'للرجال والستات',
};

export const COUNTRY = {
  AE: 'الإمارات',
  SA: 'السعودية',
};

export const COUPON_KIND = {
  percent: 'نسبة مئوية',
  fixed: 'مبلغ ثابت',
  free_ship: 'شحن مجاني',
};

/** وصف مقروء لقوة الثبات والفوحان (1–5) */
export const SCALE_5 = {
  1: 'خفيف جداً',
  2: 'خفيف',
  3: 'متوسط',
  4: 'قوي',
  5: 'قوي جداً',
};
