import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

/**
 * البوابة الوحيدة لصفحات الأدمن مع التخزين المؤقت للطلب (React cache).
 *
 * خطوتين:
 *   ① مسجّل دخول؟ (سواء عبر رأس x-user-id الموثق من proxy.js أو عبر auth.getUser())
 *   ② موجود في جدول admins؟ لو لأ → ممنوع
 *
 * باستخدام React cache()، الدالة دي بتشتغل مرة واحدة فقط في كل طلب
 * بدلاً من تكرار الاستعلام في layout ثم في الصفحة نفسها.
 *
 * @returns {Promise<{supabase: any, user: any, admin: any}>}
 */
export const requireAdmin = cache(async function requireAdmin() {
  const supabase = await createClient();

  let user = null;
  try {
    const headerList = await headers();
    const proxyUserId = headerList.get('x-user-id');
    const proxyUserEmail = headerList.get('x-user-email');

    if (proxyUserId) {
      user = { id: proxyUserId, email: proxyUserEmail };
    }
  } catch {
    // headers() might throw in some unusual contexts, fallback to getUser()
  }

  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  }

  if (!user) redirect('/admin/login');

  const { data: admin } = await supabase
    .from('admins')
    .select('user_id, email, full_name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!admin) redirect('/admin/login?denied=1');

  return { supabase, user, admin };
});
