'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireAdmin, requireManager, requirePermission, hasPermission, ALL_PERMISSIONS } from '@/lib/admin-guard';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { invalidateCacheTag } from '@/lib/actions/revalidate';
import { logAdminAction } from '@/lib/actions/audit';

import { revalidatePath, unstable_cache } from 'next/cache';

function getPrivilegedClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('إعدادات Supabase Service Role غير متوفرة على السيرفر.');
  }

  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const getCachedAuthUsers = unstable_cache(
  async () => {
    try {
      const privileged = getPrivilegedClient();
      const res = await privileged.auth.admin.listUsers();
      return res?.data?.users || [];
    } catch {
      return [];
    }
  },
  ['auth-users-metadata-cache'],
  { revalidate: 60, tags: ['admins'] }
);

/**
 * جلب قائمة المديرين الحاليين مع الرتبة والحالة وعدد الصلاحيات.
 * يدمج بيانات جدول admins مع بيانات auth.users لضمان بقاء وحفظ الصلاحيات 100%.
 */
export async function listAdmins() {
  const { user } = await requirePermission('admins.view');
  const privileged = getPrivilegedClient();

  try {
    const [
      { data: adminRows, error: dbError },
      permRes,
      authUsers,
    ] = await Promise.all([
      privileged.from('admins').select('*').order('created_at', { ascending: true }),
      privileged.from('admin_permissions').select('admin_id, permission').then((r) => r, () => ({ data: [] })),
      getCachedAuthUsers(),
    ]);

    if (dbError) throw dbError;

    const permsMap = new Map();
    for (const p of permRes?.data || []) {
      if (!permsMap.has(p.admin_id)) permsMap.set(p.admin_id, []);
      permsMap.get(p.admin_id).push(p.permission);
    }

    const authUsersMap = new Map();
    for (const u of authUsers || []) {
      authUsersMap.set(u.id, u);
    }

    const formatted = (adminRows || []).map((a) => {
      const userMeta = authUsersMap.get(a.user_id)?.user_metadata || {};
      const isOwner = a.email === 'youssef.mohammed3204@gmail.com';
      const role = isOwner ? 'manager' : (a.role || userMeta.role || 'admin');
      const status = isOwner ? 'active' : (a.status || userMeta.status || 'active');

      let perms = [];
      if (role === 'manager') {
        perms = ALL_PERMISSIONS;
      } else if (permsMap.has(a.user_id) && permsMap.get(a.user_id).length > 0) {
        perms = permsMap.get(a.user_id);
      } else if (Array.isArray(userMeta.permissions) && userMeta.permissions.length > 0) {
        perms = userMeta.permissions;
      } else {
        perms = ['dashboard.view', 'orders.view', 'products.view'];
      }

      return {
        user_id: a.user_id,
        email: a.email,
        full_name: a.full_name || userMeta.full_name || null,
        role,
        status,
        created_at: a.created_at,
        permissions: perms,
      };
    });

    return {
      ok: true,
      admins: formatted,
      currentUserId: user.id,
    };
  } catch (err) {
    return { ok: false, error: 'تعذر جلب قائمة المديرين: ' + (err?.message || err) };
  }
}

/**
 * إنشاء مشرف (Admin) جديد مع صلاحيات محددة. مقتصر حصراً على المدير العام (Manager).
 */
export async function createAdmin({ email, password, fullName, permissions = [] }) {
  const { user: caller } = await requireManager();

  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPass = String(password || '');
  const cleanName = String(fullName || '').trim();

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { ok: false, error: 'البريد الإلكتروني غير صحيح.' };
  }

  if (cleanPass.length < 8) {
    return { ok: false, error: 'كلمة المرور يجب أن لا تقل عن 8 أحرف وأرقام.' };
  }

  if (!/[a-zA-Z]/.test(cleanPass) || !/[0-9]/.test(cleanPass)) {
    return { ok: false, error: 'كلمة المرور يجب أن تحتوي على أحرف وأرقام معاً.' };
  }

  const validPerms = (Array.isArray(permissions) ? permissions : []).filter((p) =>
    ALL_PERMISSIONS.includes(p)
  );

  const privileged = getPrivilegedClient();

  const { data: existing } = await privileged
    .from('admins')
    .select('user_id')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: 'هذا البريد الإلكتروني مسجّل كمدير بالفعل.' };
  }

  // 1. إنشاء المستخدم في Supabase Auth مع حفظ الميتاداتا
  const { data: authData, error: authError } = await privileged.auth.admin.createUser({
    email: cleanEmail,
    password: cleanPass,
    email_confirm: true,
    user_metadata: {
      full_name: cleanName || cleanEmail.split('@')[0],
      role: 'admin',
      status: 'active',
      permissions: validPerms,
    },
  });

  if (authError) {
    return {
      ok: false,
      error: authError.message.includes('already registered')
        ? 'هذا البريد مسجّل مسبقاً في نظام الحسابات.'
        : `فشل إنشاء حساب المدير: ${authError.message}`,
    };
  }

  const newUserId = authData?.user?.id;

  // 2. إدراج السجل في جدول admins
  let { error: dbError } = await privileged.from('admins').insert({
    user_id: newUserId,
    email: cleanEmail,
    full_name: cleanName || null,
    role: 'admin',
    status: 'active',
  });

  // إذا كانت أعمدة role و status لم تُضف للداتابيز بعد عبر migration 02، ندرج الأعمدة الأساسية
  if (dbError && dbError.message?.includes('column')) {
    const resFallback = await privileged.from('admins').insert({
      user_id: newUserId,
      email: cleanEmail,
      full_name: cleanName || null,
    });
    dbError = resFallback.error;
  }

  if (dbError) {
    console.error('فشل إدراج المدير في جدول admins، جاري التراجع عن Auth user:', dbError);
    await privileged.auth.admin.deleteUser(newUserId).catch(console.error);
    return { ok: false, error: 'حدث خطأ أثناء حفظ بيانات المدير: ' + dbError.message };
  }

  // 3. إدراج الصلاحيات في جدول admin_permissions إن وجد
  if (validPerms.length > 0) {
    try {
      const permRows = validPerms.map((perm) => ({
        admin_id: newUserId,
        permission: perm,
      }));
      await privileged.from('admin_permissions').insert(permRows);
    } catch {
      // تجاهل إذا لم يكن الجدول موجوداً بعد
    }
  }

  // 4. تسجيل العملية في سجل التدقيق
  await logAdminAction({
    actorAdminId: caller.id,
    action: 'admin.created',
    targetAdminId: newUserId,
    targetIdentifier: cleanEmail,
    metadata: {
      fullName: cleanName,
      permissions: validPerms,
    },
  });

  await invalidateCacheTag('admins');

  return {
    ok: true,
    admin: {
      user_id: newUserId,
      email: cleanEmail,
      full_name: cleanName || null,
      role: 'admin',
      status: 'active',
      permissions: validPerms,
      created_at: new Date().toISOString(),
    },
  };
}

/**
 * تعديل حالة حساب المدير (تفعيل / تعطيل). مقتصر على المدير العام (Manager).
 * يمنع تعطيل الحساب الشخصي أو المدير الأخير.
 */
export async function toggleAdminStatus(targetUserId, newStatus) {
  const { user: caller } = await requireManager();

  if (caller.id === targetUserId) {
    return { ok: false, error: 'لا يمكنك تغيير حالة حسابك الشخصي.' };
  }

  if (newStatus !== 'active' && newStatus !== 'disabled') {
    return { ok: false, error: 'حالة الحساب غير صالحة.' };
  }

  const privileged = getPrivilegedClient();

  // فحص بيانات الهدف
  const { data: target } = await privileged
    .from('admins')
    .select('*')
    .eq('user_id', targetUserId)
    .maybeSingle();

  if (!target) {
    return { ok: false, error: 'حساب المدير غير موجود.' };
  }

  const isOwner = target.email === 'youssef.mohammed3204@gmail.com';
  if (isOwner && newStatus === 'disabled') {
    return { ok: false, error: 'لا يمكن تعطيل حساب المدير العام الأساسي للمتجر.' };
  }

  // 1. تحديث حالة الحساب في Supabase Auth عبر البان وحفظ الميتاداتا (فعال فوراً 100%)
  await privileged.auth.admin.updateUserById(targetUserId, {
    user_metadata: { status: newStatus },
    ban_duration: newStatus === 'disabled' ? '876000h' : 'none',
  });

  // 2. محاولة تحديث عمود status في جدول admins إن وجد
  try {
    await privileged
      .from('admins')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('user_id', targetUserId);
  } catch {
    // تجاهل إذا لم تكن الأعمدة متوفرة
  }

  await logAdminAction({
    actorAdminId: caller.id,
    action: newStatus === 'disabled' ? 'admin.disabled' : 'admin.enabled',
    targetAdminId: targetUserId,
    targetIdentifier: target.email,
  });

  await invalidateCacheTag('admins');

  return { ok: true };
}

/**
 * تحديث صلاحيات المشرف. مقتصر على المدير العام (Manager).
 */
export async function updateAdminPermissions(targetUserId, permissions = []) {
  const { user: caller } = await requireManager();

  const privileged = getPrivilegedClient();

  const { data: target } = await privileged
    .from('admins')
    .select('*')
    .eq('user_id', targetUserId)
    .maybeSingle();

  if (!target) {
    return { ok: false, error: 'حساب المدير غير موجود.' };
  }

  const isOwner = target.email === 'youssef.mohammed3204@gmail.com';
  if (isOwner || target.role === 'manager') {
    return { ok: false, error: 'المدير العام يمتلك دائماً كافة الصلاحيات ولا يمكن تقييدها.' };
  }

  const validPerms = (Array.isArray(permissions) ? permissions : []).filter((p) =>
    ALL_PERMISSIONS.includes(p)
  );

  // 1. تحديث الصلاحيات في Auth user_metadata
  await privileged.auth.admin.updateUserById(targetUserId, {
    user_metadata: { permissions: validPerms },
  });

  // 2. تحديث جدول admin_permissions إن وجد
  try {
    await privileged.from('admin_permissions').delete().eq('admin_id', targetUserId);
    if (validPerms.length > 0) {
      const rows = validPerms.map((perm) => ({
        admin_id: targetUserId,
        permission: perm,
      }));
      await privileged.from('admin_permissions').insert(rows);
    }
  } catch {
    // تجاهل إذا لم يكن الجدول موجوداً بعد
  }

  await logAdminAction({
    actorAdminId: caller.id,
    action: 'admin.permissions_updated',
    targetAdminId: targetUserId,
    targetIdentifier: target.email,
    metadata: { permissions: validPerms },
  });

  await invalidateCacheTag('admins');
  revalidatePath('/admin/admins');

  return { ok: true, permissions: validPerms };
}

/**
 * حذف حساب مدير مع حماية قاطعة ضد حذف المديرين العامين أو الحساب الشخصي.
 */
export async function deleteAdmin(targetUserId) {
  const { user: caller } = await requireManager();

  if (!targetUserId || typeof targetUserId !== 'string') {
    return { ok: false, error: 'معرّف المدير غير صالح.' };
  }

  if (caller.id === targetUserId) {
    return { ok: false, error: 'لا يمكنك حذف حسابك الشخصي.' };
  }

  const privileged = getPrivilegedClient();

  const { data: target } = await privileged
    .from('admins')
    .select('*')
    .eq('user_id', targetUserId)
    .maybeSingle();

  if (!target) {
    return { ok: false, error: 'حساب المدير غير موجود.' };
  }

  const isOwner = target.email === 'youssef.mohammed3204@gmail.com';
  if (isOwner || target.role === 'manager') {
    return { ok: false, error: 'لا يمكن حذف حساب مدير عام (Manager) لأسباب أمنية.' };
  }

  // 1. حذف الصلاحيات من جدول admin_permissions
  try {
    await privileged.from('admin_permissions').delete().eq('admin_id', targetUserId);
  } catch {
    // تجاهل
  }

  // 2. حذف السجل من جدول admins
  const { error: dbErr } = await privileged.from('admins').delete().eq('user_id', targetUserId);
  if (dbErr) {
    return { ok: false, error: 'تعذر إزالة المشرف من قاعدة البيانات: ' + dbErr.message };
  }

  // 3. حذف الحساب من Supabase Auth
  const { error: authErr } = await privileged.auth.admin.deleteUser(targetUserId);
  if (authErr) {
    console.warn('تم سحب الصلاحيات ولكن تعذر حذف مستخدم Auth:', authErr.message);
  }

  await logAdminAction({
    actorAdminId: caller.id,
    action: 'admin.deleted',
    targetAdminId: targetUserId,
    targetIdentifier: target.email,
  });

  await invalidateCacheTag('admins');

  return { ok: true };
}

/**
 * تغيير كلمة المرور للمدير الحالي.
 */
export async function changeOwnPassword({ currentPassword, newPassword }) {
  const { admin } = await requireAdmin();
  const cleanNew = String(newPassword || '');

  if (cleanNew.length < 8) {
    return { ok: false, error: 'كلمة المرور الجديدة يجب أن لا تقل عن 8 أحرف وأرقام.' };
  }

  if (!/[a-zA-Z]/.test(cleanNew) || !/[0-9]/.test(cleanNew)) {
    return { ok: false, error: 'كلمة المرور يجب أن تحتوي على أحرف وأرقام معاً.' };
  }

  const supabase = await createServerClient();

  if (currentPassword) {
    const { error: authCheckErr } = await supabase.auth.signInWithPassword({
      email: admin.email,
      password: currentPassword,
    });
    if (authCheckErr) {
      return { ok: false, error: 'كلمة المرور الحالية غير صحيحة.' };
    }
  }

  const { error: updateErr } = await supabase.auth.updateUser({
    password: cleanNew,
  });

  if (updateErr) {
    return { ok: false, error: 'فشل تحديث كلمة المرور: ' + updateErr.message };
  }

  await logAdminAction({
    actorAdminId: admin.user_id,
    action: 'admin.password_changed',
    targetAdminId: admin.user_id,
    targetIdentifier: admin.email,
  });

  return { ok: true };
}

/**
 * جلب سجل العمليات الإدارية الحساسة (Audit Logs).
 */
export async function listAuditLogs({ page = 1, limit = 25 } = {}) {
  const { admin } = await requireAdmin();
  if (admin.role !== 'manager' && !hasPermission(admin, 'audit_logs.view')) {
    return { ok: false, error: 'غير مصرح لك باستعراض سجل العمليات.' };
  }

  const privileged = getPrivilegedClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const { data, count, error } = await privileged
      .from('admin_audit_logs')
      .select('id, actor_admin_id, action, target_identifier, metadata, created_at, actor:admins!actor_admin_id(email, full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return { ok: true, logs: [], count: 0 };
    }

    return { ok: true, logs: data || [], count: count || 0 };
  } catch (err) {
    return { ok: false, error: 'تعذر جلب سجل العمليات: ' + err.message };
  }
}
