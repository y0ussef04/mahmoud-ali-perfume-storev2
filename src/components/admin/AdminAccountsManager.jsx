'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAdmin, deleteAdmin, changeOwnPassword } from '@/lib/actions/admin-accounts';
import { dateTimeAr } from '@/lib/money';

export default function AdminAccountsManager({ initialAdmins = [], currentUserId }) {
  const router = useRouter();
  const [admins, setAdmins] = useState(initialAdmins);

  // حالة إضافة مدير جديد
  const [newForm, setNewForm] = useState({ email: '', fullName: '', password: '', confirmPassword: '' });
  const [newBusy, setNewBusy] = useState(false);
  const [newError, setNewError] = useState('');
  const [newSuccess, setNewSuccess] = useState('');

  // حالة تغيير كلمة المرور للمدير الحالي
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passBusy, setPassBusy] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // حالة حذف مدير
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  // معالجة إنشاء مدير جديد
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
      });

      if (!res.ok) {
        setNewError(res.error || 'تعذر إنشاء حساب المدير.');
      } else {
        setNewSuccess(`تم إنشاء حساب المدير ${res.admin.email} بنجاح.`);
        setAdmins((prev) => [...prev, res.admin]);
        setNewForm({ email: '', fullName: '', password: '', confirmPassword: '' });
        router.refresh();
      }
    } catch (err) {
      setNewError(err?.message || 'حدث خطأ غير متوقع أثناء إنشاء الحساب.');
    } finally {
      setNewBusy(false);
    }
  }

  // معالجة حذف مدير
  async function handleDelete(admin) {
    setDeleteError('');
    setDeletingId(admin.user_id);
    try {
      const res = await deleteAdmin(admin.user_id);
      if (!res.ok) {
        setDeleteError(res.error || 'تعذر حذف المدير.');
      } else {
        setAdmins((prev) => prev.filter((a) => a.user_id !== admin.user_id));
        setConfirmDeleteId(null);
        router.refresh();
      }
    } catch (err) {
      setDeleteError(err?.message || 'حدث خطأ أثناء محاولة الحذف.');
    } finally {
      setDeletingId(null);
    }
  }

  // معالجة تغيير كلمة المرور
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
      }
    } catch (err) {
      setPassError(err?.message || 'حدث خطأ أثناء تحديث كلمة المرور.');
    } finally {
      setPassBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {deleteError ? (
        <p role="alert" className="border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet">
          {deleteError}
        </p>
      ) : null}

      {/* ── قائمة المديرين ── */}
      <section className="surface p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-display text-d1">المديرون الحاليون</h2>
            <p className="mt-1 text-xs2 text-ink-42">
              كل الحسابات المصرّح لها بإدارة المتجر، وتعديل المنتجات، ومتابعة الأوردرات.
            </p>
          </div>
          <span className="text-xs2 text-ink-60">
            إجمالي المديرين: <span className="font-semibold text-brass">{admins.length}</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>الاسم / البريد الإلكتروني</th>
                <th>تاريخ الإضافة</th>
                <th>الحالة</th>
                <th className="text-end">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const isMe = a.user_id === currentUserId;
                const isConfirming = confirmDeleteId === a.user_id;

                return (
                  <tr key={a.user_id}>
                    <td>
                      <div className="space-y-0.5">
                        <span className="block font-medium text-ink-80">{a.full_name || 'مدير متجر'}</span>
                        <span className="block text-xs2 font-mono text-ink-42" dir="ltr">
                          {a.email}
                        </span>
                      </div>
                    </td>
                    <td className="text-xs2 text-ink-60">
                      {a.created_at ? dateTimeAr(a.created_at) : '—'}
                    </td>
                    <td>
                      {isMe ? (
                        <span className="inline-flex items-center rounded-full bg-brass/10 px-2.5 py-0.5 text-[11px] font-semibold text-brass">
                          أنت (حسابك الحالي)
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-paper-warm px-2.5 py-0.5 text-[11px] text-ink-60 dark:bg-lacquer/50">
                          مدير
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      {isMe ? (
                        <span className="text-xs2 text-ink-42">الحساب النشط</span>
                      ) : isConfirming ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleDelete(a)}
                            disabled={deletingId === a.user_id}
                            className="text-xs2 font-semibold text-garnet underline hover:no-underline disabled:opacity-50"
                          >
                            {deletingId === a.user_id ? 'جاري الحذف…' : 'تأكيد الحذف'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={deletingId === a.user_id}
                            className="text-xs2 text-ink-42 hover:text-ink-60"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(a.user_id)}
                          disabled={admins.length <= 1}
                          className="btn-quiet text-xs2 text-garnet hover:text-red-700 disabled:opacity-40"
                          title={admins.length <= 1 ? 'لا يمكن حذف المدير الوحيد' : 'حذف المدير'}
                        >
                          حذف
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── إضافة مدير جديد ── */}
      <section className="surface p-5 sm:p-6">
        <h2 className="font-display text-d1">إضافة مدير جديد</h2>
        <p className="mt-1 text-xs2 text-ink-42">
          يُمنح المدير الجديد كامل صلاحيات لوحة التحكم ويتم تأكيد حسابه تلقائياً.
        </p>

        {newError ? (
          <p role="alert" className="mt-4 border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet">
            {newError}
          </p>
        ) : null}

        {newSuccess ? (
          <p className="mt-4 border border-sage bg-sage/8 px-4 py-3 text-xs1 text-sage">
            {newSuccess}
          </p>
        ) : null}

        <form onSubmit={handleCreate} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ad-name" className="label">الاسم الكامل (اختياري)</label>
            <input
              id="ad-name"
              type="text"
              value={newForm.fullName}
              onChange={(e) => setNewForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="محمود علي"
              className="field"
            />
          </div>

          <div>
            <label htmlFor="ad-email" className="label">البريد الإلكتروني <span className="text-garnet">*</span></label>
            <input
              id="ad-email"
              type="email"
              required
              dir="ltr"
              value={newForm.email}
              onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="admin@example.com"
              className="field text-start font-mono text-xs1"
            />
          </div>

          <div>
            <label htmlFor="ad-pass" className="label">كلمة المرور <span className="text-garnet">*</span></label>
            <input
              id="ad-pass"
              type="password"
              required
              minLength={8}
              dir="ltr"
              value={newForm.password}
              onChange={(e) => setNewForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className="field text-start"
            />
            <p className="mt-1 text-[11px] text-ink-42">8 أحرف على الأقل تحتوي حروفاً وأرقاماً.</p>
          </div>

          <div>
            <label htmlFor="ad-pass-confirm" className="label">تأكيد كلمة المرور <span className="text-garnet">*</span></label>
            <input
              id="ad-pass-confirm"
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

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              disabled={newBusy}
              className="btn-solid px-6 py-2.5"
            >
              {newBusy ? 'جاري الإنشاء…' : 'إضافة المدير'}
            </button>
          </div>
        </form>
      </section>

      {/* ── تغيير كلمة المرور للحساب الحالي ── */}
      <section className="surface p-5 sm:p-6">
        <h2 className="font-display text-d1">تغيير كلمة المرور الخاصة بك</h2>
        <p className="mt-1 text-xs2 text-ink-42">
          تحديث كلمة المرور للحساب الذي تستخدمه حالياً لتسجيل الدخول.
        </p>

        {passError ? (
          <p role="alert" className="mt-4 border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet">
            {passError}
          </p>
        ) : null}

        {passSuccess ? (
          <p className="mt-4 border border-sage bg-sage/8 px-4 py-3 text-xs1 text-sage">
            {passSuccess}
          </p>
        ) : null}

        <form onSubmit={handlePassChange} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="curr-pass" className="label">كلمة المرور الحالية (اختياري للتحقق)</label>
            <input
              id="curr-pass"
              type="password"
              dir="ltr"
              value={passForm.currentPassword}
              onChange={(e) => setPassForm((f) => ({ ...f, currentPassword: e.target.value }))}
              placeholder="••••••••"
              className="field text-start max-w-sm"
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

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              disabled={passBusy}
              className="btn-solid px-6 py-2.5"
            >
              {passBusy ? 'جاري الحفظ…' : 'تحديث كلمة المرور'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
