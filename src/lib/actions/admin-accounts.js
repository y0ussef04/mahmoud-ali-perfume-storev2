'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin-guard';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * خادم سري فائق الصلاحيات (Service Role) للعمليات الإدارية الحساسة فقط.
 * لا يتم تصديره خارج هذا الملف ولا يصل إطلاقاً لمتصفح المستخدم.
 */
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

/**
 * جلب قائمة المديرين الحاليين ببيانات آمنة فقط.
 */
export async function listAdmins() {
  const { supabase, user } = await requireAdmin();

  const { data, error } = await supabase
    .from('admins')
    .select('user_id, email, full_name, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    return { ok: false, error: 'تعذر جلب قائمة المديرين: ' + error.message };
  }

  return {
    ok: true,
    admins: data || [],
    currentUserId: user.id,
  };
}

/**
 * إنشاء مدير جديد في Supabase Auth وفي جدول public.admins
 * مع آلية Rollback آمنة تمنع الحسابات المعلقة.
 */
export async function createAdmin({ email, password, fullName }) {
  // 1. التحقق من صلاحيات المدير الطالب
  const { admin: caller } = await requireAdmin();

  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPass = String(password || '');
  const cleanName = String(fullName || '').trim();

  // 2. التحقق من صحة المدخلات
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { ok: false, error: 'البريد الإلكتروني غير صحيح.' };
  }

  if (cleanPass.length < 8) {
    return { ok: false, error: 'كلمة المرور يجب أن لا تقل عن 8 أحرف وأرقام.' };
  }

  if (!/[a-zA-Z]/.test(cleanPass) || !/[0-9]/.test(cleanPass)) {
    return { ok: false, error: 'كلمة المرور يجب أن تحتوي على أحرف وأرقام معاً.' };
  }

  const privileged = getPrivilegedClient();

  // 3. التأكد من عدم وجود البريد مسبقاً في جدول المديرين
  const { data: existing } = await privileged
    .from('admins')
    .select('user_id')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: 'هذا البريد الإلكتروني مسجّل كمدير بالفعل.' };
  }

  // 4. إنشاء المستخدم في Supabase Auth
  const { data: authData, error: authError } = await privileged.auth.admin.createUser({
    email: cleanEmail,
    password: cleanPass,
    email_confirm: true,
    user_metadata: { full_name: cleanName || cleanEmail.split('@')[0] },
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

  // 5. إضافة المستخدم لجدول public.admins
  const { error: dbError } = await privileged.from('admins').insert({
    user_id: newUserId,
    email: cleanEmail,
    full_name: cleanName || null,
  });

  // 6. آلية الـ Rollback عند فشل ربط جدول المديرين
  if (dbError) {
    console.error('فشل إدراج المدير في جدول admins، جاري التراجع وحذف حساب Auth:', dbError);
    await privileged.auth.admin.deleteUser(newUserId).catch((e) => {
      console.error('فشل التراجع عن حساب Auth:', e);
    });
    return {
      ok: false,
      error: 'حدث خطأ أثناء منح الصلاحيات لقاعدة البيانات: ' + dbError.message,
    };
  }

  return {
    ok: true,
    admin: {
      user_id: newUserId,
      email: cleanEmail,
      full_name: cleanName || null,
      created_at: new Date().toISOString(),
    },
  };
}

/**
 * حذف حساب مدير مع التحقق من الحماية ضد الحذف الذاتي والمدير الأخير.
 */
export async function deleteAdmin(targetUserId) {
  // 1. التحقق من صلاحيات المدير الطالب
  const { user: caller } = await requireAdmin();

  if (!targetUserId || typeof targetUserId !== 'string') {
    return { ok: false, error: 'معرّف المدير المطلوب حذفه غير صالح.' };
  }

  // 2. منع الحذف الذاتي
  if (caller.id === targetUserId) {
    return { ok: false, error: 'لا يمكنك حذف حسابك الشخصي من هنا.' };
  }

  const privileged = getPrivilegedClient();

  // 3. التحقق من عدد المديرين الحاليين (حماية المدير الأخير)
  const { count, error: countErr } = await privileged
    .from('admins')
    .select('user_id', { count: 'exact', head: true });

  if (countErr) {
    return { ok: false, error: 'تعذر التحقق من عدد المديرين: ' + countErr.message };
  }

  if ((count || 0) <= 1) {
    return { ok: false, error: 'لا يمكن حذف المدير الأخير في المتجر لمنع إغلاق لوحة التحكم.' };
  }

  // 4. حذف السجل من جدول public.admins أولاً
  const { error: deleteAdminErr } = await privileged
    .from('admins')
    .delete()
    .eq('user_id', targetUserId);

  if (deleteAdminErr) {
    return { ok: false, error: 'تعذر حذف صلاحيات المدير: ' + deleteAdminErr.message };
  }

  // 5. حذف المستخدم من Supabase Auth
  const { error: deleteAuthErr } = await privileged.auth.admin.deleteUser(targetUserId);
  if (deleteAuthErr) {
    console.warn('تم سحب صلاحيات المدير ولكن تعذر حذف مستخدم Auth:', deleteAuthErr.message);
  }

  return { ok: true };
}

/**
 * تغيير كلمة المرور للمدير المسجّل حالياً عبر حسابه الشخصي.
 */
export async function changeOwnPassword({ currentPassword, newPassword }) {
  const { admin, user } = await requireAdmin();
  const cleanNew = String(newPassword || '');

  if (cleanNew.length < 8) {
    return { ok: false, error: 'كلمة المرور الجديدة يجب أن لا تقل عن 8 أحرف وأرقام.' };
  }

  if (!/[a-zA-Z]/.test(cleanNew) || !/[0-9]/.test(cleanNew)) {
    return { ok: false, error: 'كلمة المرور يجب أن تحتوي على أحرف وأرقام معاً.' };
  }

  const supabase = await createServerClient();

  // إذا تم إدخال كلمة المرور الحالية، نتحقق من صحتها أولاً
  if (currentPassword) {
    const { error: authCheckErr } = await supabase.auth.signInWithPassword({
      email: admin.email,
      password: currentPassword,
    });
    if (authCheckErr) {
      return { ok: false, error: 'كلمة المرور الحالية غير صحيحة.' };
    }
  }

  // تحديث كلمة المرور عبر Supabase Auth
  const { error: updateErr } = await supabase.auth.updateUser({
    password: cleanNew,
  });

  if (updateErr) {
    return { ok: false, error: 'فشل تحديث كلمة المرور: ' + updateErr.message };
  }

  return { ok: true };
}
