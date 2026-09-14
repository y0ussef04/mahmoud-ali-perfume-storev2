'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createAdmin,
  deleteAdmin,
  toggleAdminStatus,
  updateAdminPermissions,
  changeOwnPassword,
  listAuditLogs,
} from '@/lib/actions/admin-accounts';
import { dateTimeAr } from '@/lib/money';
import {
  Users,
  FileText,
  KeyRound,
  Crown,
  Shield,
  Sparkles,
  Plus,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// تصنيف الصلاحيات لمجموعات واضحة وسهلة الفهم
const PERMISSION_GROUPS = [
  {
    category: 'لوحة التحكم والمؤشرات',
    items: [
      { id: 'dashboard.view', label: 'عرض الإحصائيات والأرقام والرسوم البيانية' },
    ],
  },
  {
    category: 'الأوردرات والمبيعات',
    items: [
      { id: 'orders.view', label: 'عرض قائمة الأوردرات وتفاصيل الفواتير' },
      { id: 'orders.update', label: 'تحديث حالة الطلب والدفع وبيانات الشحن' },
    ],
  },
  {
    category: 'العطور والكاتالوج والمخزون',
    items: [
      { id: 'products.view', label: 'استعراض المنتجات والأسعار والمخزون' },
      { id: 'products.create', label: 'إضافة عطور ومنتجات جديدة' },
      { id: 'products.update', label: 'تعديل بيانات العطور، الأسعار، والمخزون' },
      { id: 'products.delete', label: 'حذف أو إلغاء تفعيل المنتجات' },
    ],
  },
  {
    category: 'الشحن والإعدادات والشريط المتحرك',
    items: [
      { id: 'shipping.view', label: 'عرض أسعار الشحن والشريط الإعلاني والإعدادات' },
      { id: 'shipping.update', label: 'تعديل مصاريف الشحن للمحافظات' },
      { id: 'settings.view', label: 'عرض إعدادات المتجر العامة' },
      { id: 'settings.update', label: 'تحديث إعدادات المتجر والشريط المتحرك وأرقام التحويل' },
    ],
  },
  {
    category: 'أكواد الخصم والعروض',
    items: [
      { id: 'coupons.view', label: 'عرض أكواد الخصم ونسب التخفيض' },
      { id: 'coupons.create', label: 'إنشاء كود خصم جديد' },
      { id: 'coupons.update', label: 'تعديل أو إيقاف أكواد الخصم' },
      { id: 'coupons.delete', label: 'حذف أكواد الخصم' },
    ],
  },
  {
    category: 'إدارة الحسابات وسجل التدقيق (حساس)',
    items: [
      { id: 'admins.view', label: 'عرض قائمة مديري المتجر' },
      { id: 'audit_logs.view', label: 'استعراض سجل العمليات الإدارية الحساسة' },
    ],
  },
];

const ACTION_LABELS = {
  'admin.created': { text: 'إنشاء حساب مشرف', color: 'text-sage bg-sage/10 border-sage/30' },
  'admin.updated': { text: 'تعديل بيانات مدير', color: 'text-brass bg-brass/10 border-brass/30' },
  'admin.disabled': { text: 'تعطيل حساب مشرف', color: 'text-garnet bg-garnet/10 border-garnet/30' },
  'admin.enabled': { text: 'إعادة تفعيل حساب', color: 'text-sage bg-sage/10 border-sage/30' },
  'admin.deleted': { text: 'حذف حساب مشرف', color: 'text-garnet bg-garnet/10 border-garnet/30' },
  'admin.permissions_updated': { text: 'تعديل الصلاحيات', color: 'text-brass-light bg-brass/10 border-brass/30' },
  'admin.password_changed': { text: 'تغيير كلمة المرور', color: 'text-ink-60 bg-paper-warm border-hair' },
};

export default function AdminAccountsManager({
  initialAdmins = [],
  initialLogs = [],
  currentAdmin,
  currentUserId,
  isManager = false,
}) {
  const router = useRouter();

  // التبويب النشط
  const [activeTab, setActiveTab] = useState('admins'); // 'admins' | 'logs' | 'password'

  // قائمة الحسابات والفلترة
  const [admins, setAdmins] = useState(initialAdmins);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // سجل التدقيق
  const [logs, setLogs] = useState(initialLogs);
  const [logsLoading, setLogsLoading] = useState(false);

  // نافذة الصلاحيات
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editPerms, setEditPerms] = useState([]);
  const [permBusy, setPermBusy] = useState(false);
  const [permError, setPermError] = useState('');
  const [permSuccess, setPermSuccess] = useState('');

  // نافذة إنشاء مدير جديد
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newForm, setNewForm] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    permissions: ['dashboard.view', 'orders.view', 'products.view'],
  });
  const [newBusy, setNewBusy] = useState(false);
  const [newError, setNewError] = useState('');
  const [newSuccess, setNewSuccess] = useState('');

  // تغيير كلمة المرور للحساب الحالي
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passBusy, setPassBusy] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // الحذف والتعطيل
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');

  // تصفية الحسابات
  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        (a.full_name && a.full_name.toLowerCase().includes(q));

      const matchRole =
        roleFilter === 'all' ||
        (roleFilter === 'manager' && a.role === 'manager') ||
        (roleFilter === 'admin' && a.role === 'admin') ||
        (roleFilter === 'disabled' && a.status === 'disabled');

      return matchSearch && matchRole;
    });
  }, [admins, search, roleFilter]);

  // تحديث سجلات التدقيق
  async function refreshLogs() {
    setLogsLoading(true);
    try {
      const res = await listAuditLogs({ page: 1, limit: 30 });
      if (res.ok) setLogs(res.logs);
    } catch (e) {
      console.warn('Failed to refresh logs:', e);
    } finally {
      setLogsLoading(false);
    }
  }

  // معالجة إنشاء مشرف جديد
  async function handleCreate(e) {
    e.preventDefault();
    setNewError('');
    setNewSuccess('');

    if (newForm.password !== newForm.confirmPassword) {
      return setNewError('كلمة المرور وتأكيدها غير متطابقين.');
    }

    if (newForm.password.length < 8) {
      return setNewError('كلمة المرور يجب أن لا تقل عن 8 أحرف وأرقام.');
    }

    setNewBusy(true);
    try {
      const res = await createAdmin({
        email: newForm.email,
        fullName: newForm.fullName,
        password: newForm.password,
        permissions: newForm.permissions,
      });

      if (!res.ok) {
        setNewError(res.error || 'تعذر إنشاء حساب المدير.');
      } else {
        setNewSuccess(`تم إنشاء حساب المشرف ${res.admin.email} بنجاح.`);
        setAdmins((prev) => [...prev, res.admin]);
        setNewForm({
          email: '',
          fullName: '',
          password: '',
          confirmPassword: '',
          permissions: ['dashboard.view', 'orders.view', 'products.view'],
        });
        setTimeout(() => setShowCreateModal(false), 1400);
        refreshLogs();
        router.refresh();
      }
    } catch (err) {
      setNewError(err?.message || 'حدث خطأ غير متوقع أثناء إنشاء الحساب.');
    } finally {
      setNewBusy(false);
    }
  }

  // تبديل حالة الحساب (تفعيل / تعطيل)
  async function handleToggleStatus(admin) {
    setGlobalError('');
    setGlobalSuccess('');
    const nextStatus = admin.status === 'active' ? 'disabled' : 'active';
    setActionBusyId(admin.user_id);

    try {
      const res = await toggleAdminStatus(admin.user_id, nextStatus);
      if (!res.ok) {
        setGlobalError(res.error || 'تعذر تغيير حالة الحساب.');
      } else {
        setAdmins((prev) =>
          prev.map((a) => (a.user_id === admin.user_id ? { ...a, status: nextStatus } : a))
        );
        setGlobalSuccess(
          nextStatus === 'disabled'
            ? `تم تعطيل حساب ${admin.email} بنجاح.`
            : `تم إعادة تفعيل حساب ${admin.email} بنجاح.`
        );
        refreshLogs();
        router.refresh();
      }
    } catch (e) {
      setGlobalError(e?.message || 'حدث خطأ أثناء تعديل الحالة.');
    } finally {
      setActionBusyId(null);
    }
  }

  // حفظ تعديل الصلاحيات
  async function handleSavePermissions() {
    if (!editingAdmin) return;
    setPermBusy(true);
    setPermError('');
    setPermSuccess('');

    try {
      const res = await updateAdminPermissions(editingAdmin.user_id, editPerms);
      if (!res.ok) {
        setPermError(res.error || 'تعذر تحديث الصلاحيات.');
      } else {
        setPermSuccess('تم حفظ الصلاحيات المحدثة بنجاح.');
        setAdmins((prev) =>
          prev.map((a) =>
            a.user_id === editingAdmin.user_id ? { ...a, permissions: editPerms } : a
          )
        );
        setTimeout(() => setEditingAdmin(null), 1200);
        refreshLogs();
        router.refresh();
      }
    } catch (e) {
      setPermError(e?.message || 'حدث خطأ أثناء حفظ الصلاحيات.');
    } finally {
      setPermBusy(false);
    }
  }

  // حذف مشرف
  async function handleDelete(admin) {
    setGlobalError('');
    setGlobalSuccess('');
    setActionBusyId(admin.user_id);

    try {
      const res = await deleteAdmin(admin.user_id);
      if (!res.ok) {
        setGlobalError(res.error || 'تعذر حذف المشرف.');
      } else {
        setAdmins((prev) => prev.filter((a) => a.user_id !== admin.user_id));
        setConfirmDeleteId(null);
        setGlobalSuccess(`تم حذف حساب المشرف ${admin.email} نهائياً.`);
        refreshLogs();
        router.refresh();
      }
    } catch (err) {
      setGlobalError(err?.message || 'حدث خطأ أثناء محاولة الحذف.');
    } finally {
      setActionBusyId(null);
    }
  }

  // تغيير كلمة المرور للحساب الحالي
  async function handlePassChange(e) {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (passForm.newPassword !== passForm.confirmPassword) {
      return setPassError('كلمة المرور الجديدة وتأكيدها غير متطابقين.');
    }

    if (passForm.newPassword.length < 8) {
      return setPassError('كلمة المرور الجديدة يجب أن لا تقل عن 8 أحرف وأرقام.');
    }

    setPassBusy(true);
    try {
      const res = await changeOwnPassword({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });

      if (!res.ok) {
        setPassError(res.error || 'تعذر تحديث كلمة المرور.');
      } else {
        setPassSuccess('تم تحديث كلمة المرور لحسابك بنجاح.');
        setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        refreshLogs();
      }
    } catch (err) {
      setPassError(err?.message || 'حدث خطأ أثناء تحديث كلمة المرور.');
    } finally {
      setPassBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* التنبيهات العامة */}
      {globalError ? (
        <div role="alert" className="border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet rounded-lg">
          {globalError}
        </div>
      ) : null}
      {globalSuccess ? (
        <div className="border border-sage bg-sage/8 px-4 py-3 text-xs1 text-sage rounded-lg">
          {globalSuccess}
        </div>
      ) : null}

      {/* شريط التبويبات الرئيسي */}
      <div className="flex border-b border-[#E8E6E1] dark:border-[#2E2B22] gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('admins')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold border-b-2 transition-all duration-200 ${
            activeTab === 'admins'
              ? 'border-[#C9A84C] text-[#C9A84C]'
              : 'border-transparent text-[#736B5E] dark:text-[#A8A296] hover:text-[#1A1814] dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>الحسابات والرتب ({admins.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('logs');
            refreshLogs();
          }}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold border-b-2 transition-all duration-200 ${
            activeTab === 'logs'
              ? 'border-[#C9A84C] text-[#C9A84C]'
              : 'border-transparent text-[#736B5E] dark:text-[#A8A296] hover:text-[#1A1814] dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>سجل العمليات الحساسة (Audit)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold border-b-2 transition-all duration-200 ${
            activeTab === 'password'
              ? 'border-[#C9A84C] text-[#C9A84C]'
              : 'border-transparent text-[#736B5E] dark:text-[#A8A296] hover:text-[#1A1814] dark:hover:text-white'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>أمان حسابك وكلمة المرور</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          التبويب 1: جدول الحسابات والرتب والصلاحيات
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'admins' && (
        <section className="surface p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hair-soft pb-4">
            <div>
              <h2 className="font-display text-d1">حسابات الإدارة والرتب</h2>
              <p className="mt-1 text-xs2 text-ink-60">
                إدارة المديرين والمشرفين مع تحديد الصلاحيات بدقة وتأمين الدخول.
              </p>
            </div>

            {isManager ? (
              <button
                type="button"
                onClick={() => {
                  setNewError('');
                  setNewSuccess('');
                  setShowCreateModal(true);
                }}
                className="group/btn relative overflow-hidden bg-gradient-to-r from-[#1A1814] to-[#2D2921] dark:from-[#C9A84C] dark:to-[#8B6914] text-white text-xs font-semibold px-4 py-2.5 rounded-full transition-all duration-300 active:scale-[0.97] flex items-center gap-1.5 shadow-sm hover:shadow-md hover:shadow-[#C9A84C]/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                <Plus className="w-3.5 h-3.5 relative" />
                <span className="relative">إضافة مشرف جديد</span>
              </button>
            ) : null}
          </div>

          {/* شريط البحث والفلترة السريعة */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[200px] max-w-sm">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو البريد الإلكتروني…"
                className="field text-xs1"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'manager', label: 'المديرون العامون' },
                { id: 'admin', label: 'المشرفون' },
                { id: 'disabled', label: 'المعطلون' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setRoleFilter(f.id)}
                  className={`text-xs2 px-3 py-1.5 rounded-lg border transition-colors ${
                    roleFilter === f.id
                      ? 'border-brass bg-brass/10 text-brass-gilt font-bold'
                      : 'border-hair text-ink-60 hover:border-hair-soft'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* جدول الحسابات */}
          <div className="overflow-x-auto rounded-xl border border-[#E8E6E1] dark:border-[#2E2B22]">
            <table className="tbl">
              <thead>
                <tr>
                  <th>المستخدم / البريد</th>
                  <th className="w-36 text-start">الرتبة</th>
                  <th className="w-24 text-center">الحالة</th>
                  <th className="w-36 text-start">الصلاحيات</th>
                  <th className="w-36 text-start">تاريخ الإضافة</th>
                  <th className="w-36 text-end">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-ink-42 text-xs1">
                      لا توجد حسابات مطابقة لمعايير البحث.
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((a) => {
                    const isMe = a.user_id === currentUserId;
                    const isRowManager = a.role === 'manager';
                    const isRowDisabled = a.status === 'disabled';
                    const isConfirmingDelete = confirmDeleteId === a.user_id;
                    const isBusy = actionBusyId === a.user_id;

                    return (
                      <tr key={a.user_id} className={isRowDisabled ? 'opacity-60 bg-garnet/4' : ''}>
                        <td>
                          <div className="space-y-0.5">
                            <span className="font-semibold text-xs1 block text-oud">
                              {a.full_name || 'مدير'}
                              {isMe ? (
                                <span className="ms-2 text-[10px] text-brass font-normal bg-brass/10 px-1.5 py-0.5 rounded">
                                  أنت
                                </span>
                              ) : null}
                            </span>
                            <span className="block text-xs2 font-mono text-ink-42" dir="ltr">
                              {a.email}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                              isRowManager
                                ? 'bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/30'
                                : 'bg-black/5 dark:bg-white/5 text-[#736B5E] dark:text-[#A8A296] border-[#E8E6E1] dark:border-[#2E2B22]'
                            }`}
                          >
                            {isRowManager ? (
                              <Crown className="w-3.5 h-3.5 text-[#C9A84C]" />
                            ) : (
                              <Shield className="w-3.5 h-3.5 text-[#736B5E] dark:text-[#A8A296]" />
                            )}
                            <span>{isRowManager ? 'مدير عام (Manager)' : 'مشرف (Admin)'}</span>
                          </span>
                        </td>

                        <td>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isRowDisabled
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isRowDisabled ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'
                              }`}
                            />
                            <span>{isRowDisabled ? 'معطّل' : 'نشط'}</span>
                          </span>
                        </td>

                        <td>
                          {isRowManager ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C9A84C]">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>كامل الصلاحيات</span>
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs2 px-2 py-0.5 rounded bg-hair/40 font-mono text-ink-60">
                                {Array.isArray(a.permissions) ? a.permissions.length : 0} صلاحيات
                              </span>
                              {isManager ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAdmin(a);
                                    setEditPerms(Array.isArray(a.permissions) ? [...a.permissions] : []);
                                    setPermError('');
                                    setPermSuccess('');
                                  }}
                                  className="text-xs2 text-brass hover:underline"
                                >
                                  تعديل
                                </button>
                              ) : null}
                            </div>
                          )}
                        </td>

                        <td className="text-xs2 text-ink-60">
                          {a.created_at ? dateTimeAr(a.created_at) : '—'}
                        </td>

                        <td className="text-end">
                          {isMe ? (
                            <span className="text-xs2 text-ink-42">حسابك الحالي</span>
                          ) : isRowManager ? (
                            <span className="text-xs2 text-ink-42">محمي</span>
                          ) : isManager ? (
                            <div className="flex items-center justify-end gap-2">
                              {/* زر تفعيل / تعطيل */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(a)}
                                disabled={isBusy}
                                className={`text-xs2 font-semibold px-2 py-1 rounded transition-colors ${
                                  isRowDisabled
                                    ? 'text-sage hover:bg-sage/10'
                                    : 'text-garnet hover:bg-garnet/10'
                                }`}
                              >
                                {isBusy
                                  ? 'جارٍ…'
                                  : isRowDisabled
                                    ? 'تفعيل'
                                    : 'تعطيل'}
                              </button>

                              {/* زر الحذف */}
                              {isConfirmingDelete ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(a)}
                                    disabled={isBusy}
                                    className="text-xs2 font-bold text-garnet underline"
                                  >
                                    تأكيد؟
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="text-xs2 text-ink-42"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(a.user_id)}
                                  disabled={isBusy}
                                  className="text-xs2 text-garnet hover:underline opacity-80 hover:opacity-100"
                                >
                                  حذف
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs2 text-ink-42">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          التبويب 2: سجل العمليات الحساسة (Audit Logs)
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'logs' && (
        <section className="surface p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-hair-soft pb-4">
            <div>
              <h2 className="font-display text-d1">سجل العمليات الإدارية (Audit Logs)</h2>
              <p className="mt-1 text-xs2 text-ink-60">
                تسجيل زمني دقيق لكل العمليات الحساسة المنفذة في لوحة التحكم لمنع التلاعب وتتبع التغييرات.
              </p>
            </div>
            <button
              type="button"
              onClick={refreshLogs}
              disabled={logsLoading}
              className="btn-ghost text-xs2 px-3 py-1.5"
            >
              {logsLoading ? 'جارٍ التحديث…' : 'تحديث السجل'}
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E8E6E1] dark:border-[#2E2B22]">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-36 text-start">الوقت والتاريخ</th>
                  <th className="w-36 text-start">المنفّذ (Actor)</th>
                  <th className="w-32 text-center">العملية</th>
                  <th className="w-36 text-start">الهدف (Target)</th>
                  <th className="text-start">التفاصيل الإضافية</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-ink-42 text-xs1">
                      {logsLoading ? 'جارٍ تحميل السجلات…' : 'لا توجد عمليات مسجلة حتى الآن.'}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const actionInfo = ACTION_LABELS[log.action] || {
                      text: log.action,
                      color: 'text-ink-60 bg-paper-warm border-hair',
                    };
                    const actorName = log.actor?.full_name || log.actor?.email || log.actor_admin_id || 'النظام';

                    return (
                      <tr key={log.id}>
                        <td className="text-xs2 text-ink-60 whitespace-nowrap">
                          {log.created_at ? dateTimeAr(log.created_at) : '—'}
                        </td>
                        <td className="font-medium text-xs1 text-oud">
                          {actorName}
                        </td>
                        <td>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold border ${actionInfo.color}`}
                          >
                            {actionInfo.text}
                          </span>
                        </td>
                        <td className="text-xs2 font-mono text-ink-60" dir="ltr">
                          {log.target_identifier || log.target_admin_id || '—'}
                        </td>
                        <td className="text-xs2 text-ink-42 max-w-xs truncate">
                          {log.metadata && Object.keys(log.metadata).length > 0
                            ? JSON.stringify(log.metadata)
                            : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          التبويب 3: تغيير كلمة المرور للحساب الحالي
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'password' && (
        <section className="surface p-5 sm:p-6 max-w-2xl">
          <h2 className="font-display text-d1">تغيير كلمة المرور الخاصة بك</h2>
          <p className="mt-1 text-xs2 text-ink-60">
            تحديث كلمة المرور لحسابك المسجّل حالياً ({currentAdmin?.email}).
          </p>

          {passError ? (
            <p role="alert" className="mt-4 border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet rounded-lg">
              {passError}
            </p>
          ) : null}

          {passSuccess ? (
            <p className="mt-4 border border-sage bg-sage/8 px-4 py-3 text-xs1 text-sage rounded-lg">
              {passSuccess}
            </p>
          ) : null}

          <form onSubmit={handlePassChange} className="mt-5 space-y-4">
            <div>
              <label htmlFor="curr-pass" className="label">كلمة المرور الحالية (اختياري للتحقق)</label>
              <input
                id="curr-pass"
                type="password"
                dir="ltr"
                value={passForm.currentPassword}
                onChange={(e) => setPassForm((f) => ({ ...f, currentPassword: e.target.value }))}
                placeholder="••••••••"
                className="field text-start"
              />
            </div>

            <div>
              <label htmlFor="chg-pass" className="label">كلمة المرور الجديدة <span className="text-garnet">*</span></label>
              <input
                id="chg-pass"
                type="password"
                required
                minLength={8}
                dir="ltr"
                value={passForm.newPassword}
                onChange={(e) => setPassForm((f) => ({ ...f, newPassword: e.target.value }))}
                placeholder="••••••••"
                className="field text-start"
              />
              <p className="mt-1 text-[11px] text-ink-42">8 أحرف على الأقل تحتوي حروفاً وأرقاماً.</p>
            </div>

            <div>
              <label htmlFor="chg-pass-confirm" className="label">تأكيد كلمة المرور الجديدة <span className="text-garnet">*</span></label>
              <input
                id="chg-pass-confirm"
                type="password"
                required
                minLength={8}
                dir="ltr"
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="••••••••"
                className="field text-start"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passBusy}
                className="btn-solid px-6 py-2.5"
              >
                {passBusy ? 'جارٍ التحديث…' : 'تحديث كلمة المرور'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          Modal: إضافة مشرف جديد
          ══════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="surface max-w-2xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-hair-soft pb-3">
              <div>
                <h3 className="font-display text-d1">إضافة مشرف جديد (New Admin)</h3>
                <p className="text-xs2 text-ink-60">
                  الحساب الجديد يُمنح رتبة مشرف (Admin) مع الصلاحيات المختارة أدناه فقط.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-ink-42 hover:text-oud p-1 text-lg"
              >
                ✕
              </button>
            </div>

            {newError ? (
              <p role="alert" className="border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet rounded-lg">
                {newError}
              </p>
            ) : null}

            {newSuccess ? (
              <p className="border border-sage bg-sage/8 px-4 py-3 text-xs1 text-sage rounded-lg">
                {newSuccess}
              </p>
            ) : null}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">الاسم الكامل</label>
                  <input
                    type="text"
                    value={newForm.fullName}
                    onChange={(e) => setNewForm((f) => ({ ...f, fullName: e.target.value }))}
                    placeholder="أحمد محمد"
                    className="field"
                  />
                </div>
                <div>
                  <label className="label">البريد الإلكتروني <span className="text-garnet">*</span></label>
                  <input
                    type="email"
                    required
                    dir="ltr"
                    value={newForm.email}
                    onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="ahmed@example.com"
                    className="field text-start font-mono text-xs1"
                  />
                </div>
                <div>
                  <label className="label">كلمة المرور <span className="text-garnet">*</span></label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    dir="ltr"
                    value={newForm.password}
                    onChange={(e) => setNewForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    className="field text-start"
                  />
                </div>
                <div>
                  <label className="label">تأكيد كلمة المرور <span className="text-garnet">*</span></label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    dir="ltr"
                    value={newForm.confirmPassword}
                    onChange={(e) => setNewForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="••••••••"
                    className="field text-start"
                  />
                </div>
              </div>

              {/* اختيار الصلاحيات */}
              <div className="pt-3 border-t border-hair-soft">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-oud">تحديد الصلاحيات الممنوحة للمشرف:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const all = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.id));
                        setNewForm((f) => ({ ...f, permissions: all }));
                      }}
                      className="text-xs2 text-brass hover:underline"
                    >
                      تحديد الكل
                    </button>
                    <span className="text-hair-soft">·</span>
                    <button
                      type="button"
                      onClick={() => setNewForm((f) => ({ ...f, permissions: [] }))}
                      className="text-xs2 text-garnet hover:underline"
                    >
                      إلغاء الكل
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {PERMISSION_GROUPS.map((g, gIdx) => (
                    <div key={gIdx} className="rounded-xl border border-hair/60 bg-elevated/40 p-3.5 space-y-2">
                      <span className="text-xs font-bold text-oud block mb-2">{g.category}</span>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {g.items.map((item) => {
                          const checked = newForm.permissions.includes(item.id);
                          return (
                            <label
                              key={item.id}
                              className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs leading-relaxed ${
                                checked ? 'bg-brass/8 text-oud' : 'text-ink-60 hover:bg-hair/20'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const c = e.target.checked;
                                  setNewForm((f) => ({
                                    ...f,
                                    permissions: c
                                      ? [...f.permissions, item.id]
                                      : f.permissions.filter((p) => p !== item.id),
                                  }));
                                }}
                                className="accent-brass mt-0.5"
                              />
                              <span>{item.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-hair-soft">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={newBusy}
                  className="btn-ghost text-xs1 px-4 py-2"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={newBusy}
                  className="btn-solid text-xs1 px-6 py-2"
                >
                  {newBusy ? 'جارٍ الإنشاء…' : 'إنشاء المشرف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          Modal: تعديل صلاحيات المشرف
          ══════════════════════════════════════════════════════════ */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="surface max-w-2xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-hair-soft pb-3">
              <div>
                <h3 className="font-display text-d1">
                  تعديل صلاحيات: {editingAdmin.full_name || editingAdmin.email}
                </h3>
                <p className="text-xs2 font-mono text-ink-60" dir="ltr">
                  {editingAdmin.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="text-ink-42 hover:text-oud p-1 text-lg"
              >
                ✕
              </button>
            </div>

            {permError ? (
              <p role="alert" className="border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet rounded-lg">
                {permError}
              </p>
            ) : null}

            {permSuccess ? (
              <p className="border border-sage bg-sage/8 px-4 py-3 text-xs1 text-sage rounded-lg">
                {permSuccess}
              </p>
            ) : null}

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-oud">اختر الصلاحيات المسموح بها لهذا الحساب:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const all = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.id));
                    setEditPerms(all);
                  }}
                  className="text-xs2 text-brass hover:underline"
                >
                  تحديد الكل
                </button>
                <span className="text-hair-soft">·</span>
                <button
                  type="button"
                  onClick={() => setEditPerms([])}
                  className="text-xs2 text-garnet hover:underline"
                >
                  إلغاء الكل
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {PERMISSION_GROUPS.map((g, gIdx) => (
                <div key={gIdx} className="rounded-xl border border-hair/60 bg-elevated/40 p-3.5 space-y-2">
                  <span className="text-xs font-bold text-oud block mb-2">{g.category}</span>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {g.items.map((item) => {
                      const checked = editPerms.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs leading-relaxed ${
                            checked ? 'bg-brass/8 text-oud font-medium' : 'text-ink-60 hover:bg-hair/20'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const c = e.target.checked;
                              setEditPerms((prev) =>
                                c ? [...prev, item.id] : prev.filter((p) => p !== item.id)
                              );
                            }}
                            className="accent-brass mt-0.5"
                          />
                          <span>{item.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-hair-soft">
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                disabled={permBusy}
                className="btn-ghost text-xs1 px-4 py-2"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                disabled={permBusy}
                className="btn-solid text-xs1 px-6 py-2"
              >
                {permBusy ? 'جارٍ الحفظ…' : 'حفظ الصلاحيات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
