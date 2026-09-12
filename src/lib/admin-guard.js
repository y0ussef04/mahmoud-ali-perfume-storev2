import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const ALL_PERMISSIONS = [
  'dashboard.view',
  'orders.view',
  'orders.update',
  'products.view',
  'products.create',
  'products.update',
  'products.delete',
  'shipping.view',
  'shipping.update',
  'coupons.view',
  'coupons.create',
  'coupons.update',
  'coupons.delete',
  'settings.view',
  'settings.update',
  'admins.view',
  'admins.create',
  'admins.update',
  'admins.delete',
  'admins.manage_permissions',
  'audit_logs.view',
];

/**
 * فحص ما إذا كان كائن الأدمن يمتلك الصلاحية المطلوبة (المدير العام يمتلك الكل دائماً).
 */
export function hasPermission(admin, permission) {
  if (!admin) return false;
  if (admin.role === 'manager' || admin.isManager) return true;
  return Array.isArray(admin.permissions) && admin.permissions.includes(permission);
}

import { unstable_cache } from 'next/cache';

/**
 * جلب بيانات الأدمن وصلاحياته من قاعدة البيانات مع كاش داخلي سريع (0ms)
 * يُلغى تلقائياً عند تعديل أي صلاحية أو حساب مدير عبر وسام 'admins'.
 */
const getCachedAdminProfile = unstable_cache(
  async (userId) => {
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: adminRow } = await adminClient
      .from('admins')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!adminRow) return null;

    const isPrimaryOwner = adminRow.email === 'youssef.mohammed3204@gmail.com';
    let role = isPrimaryOwner ? 'manager' : (adminRow.role || null);
    let status = isPrimaryOwner ? 'active' : (adminRow.status || null);
    let permissions = [];

    if (role === 'manager') {
      permissions = ALL_PERMISSIONS;
    } else {
      let permRows = null;
      try {
        const res = await adminClient
          .from('admin_permissions')
          .select('permission')
          .eq('admin_id', userId);
        permRows = res.data;
      } catch {
        permRows = [];
      }

      if (Array.isArray(permRows) && permRows.length > 0) {
        permissions = permRows.map((p) => p.permission);
      } else {
        // فحص الصلاحيات المحفوظة في Supabase Auth user_metadata
        try {
          const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
          const meta = authUser?.user?.user_metadata || {};
          if (!role) role = meta.role || 'admin';
          if (!status) status = meta.status || 'active';
          if (Array.isArray(meta.permissions) && meta.permissions.length > 0) {
            permissions = meta.permissions;
          } else {
            permissions = ['dashboard.view', 'orders.view', 'products.view'];
          }
        } catch {
          permissions = ['dashboard.view', 'orders.view', 'products.view'];
        }
      }
    }

    role = role || 'admin';
    status = status || 'active';

    return {
      user_id: adminRow.user_id,
      email: adminRow.email,
      full_name: adminRow.full_name || null,
      role,
      status,
      isManager: role === 'manager',
      permissions,
    };
  },
  ['admin-profile-data'],
  { revalidate: 60, tags: ['admins'] }
);

/**
 * البوابة الأساسية لصفحات وإجراءات الأدمن.
 * تُنفّذ مرة واحدة فقط لكل طلب HTTP باستخدام React cache().
 * تعتمد حصرياً على جلسة Supabase Auth الموقّعة وتمنع أي تزوير عبر ترويسات العميل.
 */
export const requireAdmin = cache(async function requireAdmin() {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;

  if (authError || !user) {
    redirect('/admin/login');
  }

  const admin = await getCachedAdminProfile(user.id);

  if (!admin) {
    redirect('/admin/login?denied=1');
  }

  // التحقق من حالة الحساب: إذا كان معطلاً يُمنع فوراً
  if (admin.status === 'disabled') {
    redirect('/admin/login?disabled=1');
  }

  return { supabase, user, admin };
});

/**
 * التحقق الحصري من رتبة المدير العام (Manager).
 */
export const requireManager = cache(async function requireManager() {
  const ctx = await requireAdmin();
  if (ctx.admin.role !== 'manager') {
    throw new Error('غير مصرح لك: هذه العملية مقتصرة على المدير العام (Manager) فقط.');
  }
  return ctx;
});

/**
 * التحقق من صلاحية محددة، ويُسمح دائماً للمدير العام.
 * تدعم الخيار throwOnly للاستخدام في إجراءات السيرفر (Server Actions) دون إجبار المتصفح على إعادة توجيه عنيفة.
 */
export const requirePermission = cache(async function requirePermission(
  permission,
  { throwOnly = false } = {}
) {
  const ctx = await requireAdmin();
  if (!hasPermission(ctx.admin, permission)) {
    if (throwOnly) {
      throw new Error(`غير مصرح لك: ينقصك إذن الوصول (${permission}).`);
    }
    redirect('/admin?unauthorized=1');
  }
  return ctx;
});
