// ══════════════════════════════════════════════════════════
//  حساب المجموع — نسخة الواجهة
//
//  ⚠️ مهم: الحساب ده للعرض بس. الحساب المُلزِم بيحصل جوه
//  دالة place_order في الداتابيز بأسعار الداتابيز، عشان محدش
//  يعدّل سعر من الـ DevTools. القواعد هنا لازم تطابقها بالحرف.
// ══════════════════════════════════════════════════════════

/**
 * قراءة رقم من جدول الإعدادات.
 *
 * ⚠️ ماتستخدمش `Number(v) || fallback` هنا أبداً. الصفر قيمة مقصودة:
 * `cod_fee = 0` معناه "مافيش رسم تحصيل"، و`free_ship_threshold = 0`
 * معناه "مافيش عرض شحن مجاني" — ولوحة التحكم نفسها بتقول للأدمن
 * يحطّ صفر لو مش عايز العرض. مع `||` الصفر بيتحوّل للافتراضي،
 * فالواجهة تحسب حساب والداتابيز تحسب حساب تاني والعميل يشوف
 * مجموع ويتحاسب على غيره.
 *
 * فبنرجع للافتراضي لو القيمة مش رقم صالح بس.
 */
export function settingNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * @param {Object} p
 * @param {number} p.subtotal      مجموع البنود
 * @param {number|null} p.baseFee  مصروف شحن المحافظة (null = لسه ماختارش)
 * @param {number} p.threshold     حد الشحن المجاني (صفر = مافيش عرض)
 * @param {number} p.codFee        رسم التحصيل
 * @param {string} p.method        cod | card | wallet
 * @param {Object|null} p.coupon   { discount, free_ship } من validate_coupon
 */
export function computeTotals({
  subtotal = 0,
  baseFee = null,
  threshold = 1500,
  codFee = 15,
  method = 'cod',
  coupon = null,
}) {
  const sub = round2(subtotal);
  const offer = Number(threshold) > 0; // فيه عرض شحن مجاني من الأصل؟
  // الخصم متسقّف بالمجموع زي `least(value, subtotal)` في SQL بالظبط.
  // السقف موجود في الاتنين مش في واحد، عشان لو الـ API رجّع رقم أكبر
  // مانعرضش مجموع أقل من اللي الداتابيز هتحسبه.
  const discount = Math.min(round2(coupon?.discount || 0), sub);
  const couponFreeShip = Boolean(coupon?.free_ship);

  // الشحن المجاني بالحد أو بالكوبون
  const earnedFree = offer && sub >= threshold;
  const freeShip = couponFreeShip || earnedFree;

  // null معناه "مش معروف لسه" مش صفر — الفرق مهم في العرض
  const shipping = freeShip ? 0 : baseFee == null ? null : round2(baseFee);

  const cod = method === 'cod' ? round2(codFee) : 0;

  const total = Math.max(round2(sub + (shipping || 0) + cod - discount), 0);

  return {
    subtotal: sub,
    baseFee: baseFee == null ? null : round2(baseFee),
    shipping,
    freeShip,
    earnedFree,
    cod,
    discount,
    total,
    /** كام باقي على الشحن المجاني — null لو وصل خلاص أو مافيش عرض */
    remainingForFreeShip:
      !offer || earnedFree || couponFreeShip ? null : round2(threshold - sub),
  };
}

export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
