/**
 * حدّ معدّل بسيط في الذاكرة.
 *
 * ⚠️ محدوديته: على Vercel كل instance عنده ذاكرته لوحده، فالحدّ
 * تقريبي مش مطلق. بيمنع الضغط الغبي مش الهجمة المنظّمة.
 * لو الموقع كبر، انقله لـ Upstash Redis أو Vercel KV.
 */
const buckets = new Map();

/**
 * @param {string} key   مفتاح التجميع — عادةً الـ IP + اسم المسار
 * @param {number} limit عدد الطلبات المسموحة
 * @param {number} windowMs مدة النافذة
 * @returns {{ok: boolean, retryAfter: number}}
 */
export function rateLimit(key, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - hits[0])) / 1000);
    return { ok: false, retryAfter };
  }

  hits.push(now);
  buckets.set(key, hits);

  // تنضيف عشوائي خفيف عشان الخريطة ماتكبرش
  if (buckets.size > 5000 && Math.random() < 0.02) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }

  return { ok: true, retryAfter: 0 };
}

/** IP الزائر من هيدرات البروكسي */
export function clientIp(req) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
