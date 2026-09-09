import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { clientIp, rateLimit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

/** POST { code, subtotal } → { ok, discount, free_ship } أو { ok:false, error } */
export async function POST(req) {
  // تخمين الأكواد بالعشوائي — نحدّه
  const gate = rateLimit(`coupon:${clientIp(req)}`, 12, 60_000);
  if (!gate.ok) {
    return NextResponse.json(
      { ok: false, error: `جرّبت كتير. استنى ${gate.retryAfter} ثانية.` },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'طلب غير صالح.' }, { status: 400 });
  }

  const code = String(body?.code || '').trim();
  const subtotal = Number(body?.subtotal);

  if (!code) {
    return NextResponse.json({ ok: false, error: 'اكتب الكود.' }, { status: 400 });
  }
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return NextResponse.json(
      { ok: false, error: 'العربة فاضية.' },
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_code: code,
      p_subtotal: subtotal,
    });

    if (error) throw error;

    // الدالة بترجع jsonb فيه ok و error أو discount
    return NextResponse.json(data, { status: data?.ok ? 200 : 422 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'مشكلة في التحقق من الكود.' },
      { status: 500 }
    );
  }
}
