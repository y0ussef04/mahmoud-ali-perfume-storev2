import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * البوابة الوحيدة لصفحات الأدمن.
 *
 * خطوتين:
 *   ① مسجّل دخول؟ لو لأ → صفحة الدخول
 *   ② موجود في جدول admins؟ لو لأ → ممنوع
 *
 * الخطوة التانية مهمة: أي حد يقدر يعمل حساب في Supabase Auth،
 * بس ده مايخلّيهوش أدمن. الأدمن هو اللي صفّه موجود في public.admins،
 * ونفس الشرط ده مطبّق في RLS فمافيش طريق حوله.
 *
 * @returns {Promise<{supabase: any, user: any, admin: any}>}
 */
export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: admin } = await supabase
    .from('admins')
    .select('user_id, email, full_name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!admin) redirect('/admin/login?denied=1');

  return { supabase, user, admin };
}
