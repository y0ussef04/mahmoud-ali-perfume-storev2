import { createClient } from '@supabase/supabase-js';

/**
 * ⚠️ كلاينت مفتاح الخدمة — بيتخطّى RLS بالكامل.
 * يُستخدم في API routes بس (إنشاء الأوردر، التتبع، التصدير).
 * مايتستوردش أبداً في ملف فيه 'use client'.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY ناقص. حُطّه في .env.local وفي إعدادات Vercel.'
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
