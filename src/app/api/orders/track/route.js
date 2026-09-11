import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { clientIp, rateLimit } from '@/lib/ratelimit';
import { normalizePhone } from '@/lib/validate';

export const dynamic = 'force-dynamic';

/**
 * POST { order_no, phone } → بيانات الأوردر.
 *
 * الرقمين مع بعض هما المفتاح. مافيش حسابات في الموقع، فالتحقق ده
 * كفاية عملياً: لازم تعرف رقم الأوردر ورقم الموبايل اللي طلب بيه.
 */
export async function POST(req) {
  const gate = rateLimit(`track:${clientIp(req)}`, 15, 60_000);
  if (!gate.ok) {
    return NextResponse.json(
      { ok: false, error: `تجاوزت عدد المحاولات المسموح بها. يرجى الانتظار ${gate.retryAfter} ثانية.` },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'طلب غير صالح.' }, { status: 400 });
  }

  const orderNo = String(body?.order_no || '').trim().toUpperCase();
  const phone = normalizePhone(body?.phone);

  if (!/^MA-\d{6}-\d{4}$/.test(orderNo)) {
    return NextResponse.json(
      { ok: false, error: 'يرجى إدخال رقم الطلب بالصيغة الصحيحة، مثال: MA-260909-0001' },
      { status: 400 }
    );
  }
  if (!/^01[0125][0-9]{8}$/.test(phone)) {
    return NextResponse.json({ ok: false, error: 'رقم الهاتف غير صحيح. يرجى إدخال ١١ رقماً تبدأ بـ 01.' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('orders')
      .select(
        `order_no, status, payment_method, payment_status, governorate, area,
         subtotal, shipping_fee, cod_fee, discount, total, items_count,
         coupon_code, created_at, updated_at,
         order_items ( product_name, variant_label, brand_name, unit_price, qty, line_total )`
      )
      .eq('order_no', orderNo)
      .eq('phone', phone)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // نفس الرسالة للحالتين — لحماية الخصوصية
      return NextResponse.json(
        { ok: false, error: 'لم يتم العثور على طلب مطابق للبيانات المدخلة. يرجى التحقق من الرقمين.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, order: data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: 'تعذر معالجة الطلب حالياً. يرجى المحاولة لاحقاً.' },
      { status: 500 }
    );
  }
}
