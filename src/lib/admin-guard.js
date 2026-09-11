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
import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/** كاش فوري في الذاكرة لحسابات الأدمن لمدة 5 دقائق لتقليل وقت الاستعلام إلى 0ms */
const getCachedAdmin = unstable_cache(
  async (userId) => {
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data } = await adminClient
      .from('admins')
      .select('user_id, email, full_name')
      .eq('user_id', userId)
      .maybeSingle();
    return data || null;
  },
  ['admin-auth-record'],
  { revalidate: 300, tags: ['admins'] }
);

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

  const admin = await getCachedAdmin(user.id);

  if (!admin) redirect('/admin/login?denied=1');

  return { supabase, user, admin };
});
