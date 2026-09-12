'use server';

import { createClient } from '@supabase/supabase-js';

function getPrivilegedClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * تسجيل العمليات الحساسة في جدول التدقيق (public.admin_audit_logs).
 * يتم تنفيذها بشكل آمن على السيرفر فقط دون كشف أي أسرار أو كلمات مرور.
 */
export async function logAdminAction({
  actorAdminId,
  action,
  targetAdminId = null,
  targetIdentifier = null,
  metadata = {},
  ipAddress = null,
}) {
  try {
    const privileged = getPrivilegedClient();
    if (!privileged) return;

    // تصفية أي بيانات حساسة قد تكون في metadata عن طريق الخطأ
    const safeMeta = { ...metadata };
    delete safeMeta.password;
    delete safeMeta.confirmPassword;
    delete safeMeta.currentPassword;
    delete safeMeta.token;
    delete safeMeta.access_token;
    delete safeMeta.refresh_token;
    delete safeMeta.secret;
    delete safeMeta.service_role_key;
    delete safeMeta.apiKey;
    delete safeMeta.card;
    delete safeMeta.cvv;

    await privileged.from('admin_audit_logs').insert({
      actor_admin_id: actorAdminId || null,
      action: String(action),
      target_admin_id: targetAdminId || null,
      target_identifier: targetIdentifier ? String(targetIdentifier) : null,
      metadata: safeMeta,
      ip_address: ipAddress || null,
    });
  } catch (err) {
    console.warn('[Audit Log] Failed to write audit record:', err?.message || err);
  }
}
