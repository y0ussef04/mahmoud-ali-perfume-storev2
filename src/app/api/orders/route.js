import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { clientIp, rateLimit } from '@/lib/ratelimit';
import { normalizePhone } from '@/lib/validate';

export const dynamic = 'force-dynamic';

const METHODS = ['cod', 'card', 'wallet'];
const MAX_LINES = 30;
const MAX_QTY_PER_LINE = 20;

/**
 * POST — إنشاء أوردر.
 *
 * كل الحسابات بتحصل جوه دالة place_order في الداتابيز:
 * الأسعار والشحن والخصم بتتقرأ من الجداول، مش من الـ body.
 * اللي جاي من المتصفح هو variant_id والكمية والعنوان بس.
 */
export async function POST(req) {
  const gate = rateLimit(`order:${clientIp(req)}`, 6, 60_000);
  if (!gate.ok) {
    return NextResponse.json(
      { ok: false, error: `طلبات كتير ورا بعضها. استنى ${gate.retryAfter} ثانية.` },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'طلب غير صالح.' }, { status: 400 });
  }

  // ─── تنقية البنود ───────────────────────────────────────
  const rawItems = Array.isArray(body?.items) ? body.items : [];
  if (rawItems.length === 0) {
    return NextResponse.json({ ok: false, error: 'العربة فاضية.' }, { status: 400 });
  }
  if (rawItems.length > MAX_LINES) {
    return NextResponse.json(
      { ok: false, error: 'عدد البنود كبير جداً. كلّمنا على واتساب للأوردرات الكبيرة.' },
      { status: 400 }
    );
  }

  const items = [];
  for (const it of rawItems) {
    const id = String(it?.variant_id || '');
    const qty = Math.floor(Number(it?.qty));

    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ ok: false, error: 'بند غير صالح في العربة.' }, { status: 400 });
    }
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      return NextResponse.json({ ok: false, error: 'كمية غير صالحة.' }, { status: 400 });
    }
    items.push({ variant_id: id, qty });
  }

  // ─── طريقة الدفع ────────────────────────────────────────
  const method = String(body?.payment_method || '');
  if (!METHODS.includes(method)) {
    return NextResponse.json({ ok: false, error: 'اختار طريقة دفع.' }, { status: 400 });
  }

  // ─── العميل ─────────────────────────────────────────────
  const c = body?.customer || {};
  const phone = normalizePhone(c.phone);
  const phone2 = c.phone2 ? normalizePhone(c.phone2) : '';

  if (!/^01[0125][0-9]{8}$/.test(phone)) {
    return NextResponse.json({ ok: false, error: 'رقم الموبايل مش صحيح.' }, { status: 400 });
  }

  const customer = {
    name: trim(c.name, 90),
    phone,
    phone2: phone2 || null,
    governorate: trim(c.governorate, 40),
    area: trim(c.area, 90),
    street: trim(c.street, 220),
    landmark: trim(c.landmark, 140) || null,
    note: trim(c.note, 400) || null,
  };

  if (!customer.name || !customer.governorate || !customer.area || !customer.street) {
    return NextResponse.json({ ok: false, error: 'بيانات الشحن ناقصة.' }, { status: 400 });
  }

  // ─── التحويل ────────────────────────────────────────────
  let transferRef = null;
  let receiptUrl = null;

  if (method === 'wallet') {
    transferRef = trim(body?.transfer_ref, 60);
    receiptUrl = trim(body?.receipt_url, 400);

    if (!transferRef) {
      return NextResponse.json(
        { ok: false, error: 'اكتب رقم العملية أو المحفظة اللي حوّلت منها.' },
        { status: 400 }
      );
    }
    // المسار لازم يكون مسار نسبي جوه باكِت receipts — مش أي رابط خارجي
    if (
      !receiptUrl ||
      !/^[A-Za-z0-9_./-]+$/.test(receiptUrl) ||
      receiptUrl.includes('..') ||
      receiptUrl.startsWith('/')
    ) {
      return NextResponse.json(
        { ok: false, error: 'صورة الإيصال مترفعتش صح. جرّب ترفعها تاني.' },
        { status: 400 }
      );
    }
  }

  // ─── نداء الداتابيز ─────────────────────────────────────
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc('place_order', {
      p_customer: customer,
      p_items: items,
      p_payment_method: method,
      p_coupon_code: trim(body?.coupon_code, 40) || null,
      p_transfer_ref: transferRef,
      p_receipt_url: receiptUrl,
    });

    if (error) {
      // رسايل place_order مكتوبة بالعربي وصالحة للعرض
      return NextResponse.json(
        { ok: false, error: error.message || 'الأوردر مانفعش يتسجّل.' },
        { status: 422 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'مشكلة في السيرفر. جرّب تاني.' },
      { status: 500 }
    );
  }
}

function trim(v, max) {
  return String(v ?? '')
    .replace(/[\0\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, max);
}
