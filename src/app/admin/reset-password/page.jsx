'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mark } from '@/components/Logo';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // استماع لأحداث المصادقة أو التحقق من الجلسة المستعادة
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasSession(true);
        setCheckingSession(false);
      }
    });

    // فحص مباشر للجلسة الحالية
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasSession(true);
      }
      setCheckingSession(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('كلمة المرور وتأكيدها غير متطابقين.');
    }

    if (password.length < 8) {
      return setError('كلمة المرور يجب أن لا تقل عن 8 أحرف وأرقام.');
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return setError('كلمة المرور يجب أن تحتوي على أحرف وأرقام معاً.');
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || 'فشل تعيين كلمة المرور الجديدة.');
      } else {
        setSuccess(true);
        // تسجيل خروج لضمان تسجيل الدخول بكلمة المرور الجديدة
        await supabase.auth.signOut().catch(() => {});
      }
    } catch (err) {
      setError(err?.message || 'حدث خطأ أثناء الاتصال بالسيرفر.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-lacquer px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Mark size={64} />
          <h1 className="mt-6 font-display text-d3 text-frost">تعيين كلمة المرور</h1>
          <p className="mt-2 text-xs2 tracking-wide2 text-brass">
            Mahmoud-Ali&apos;s store
          </p>
        </div>

        {checkingSession ? (
          <div className="mt-8 text-center">
            <p className="text-xs2 tracking-wide2 text-brass">جاري التحقق من الرابط الآمن…</p>
          </div>
        ) : success ? (
          <div className="mt-8 space-y-6">
            <div className="border border-sage bg-sage/12 px-4 py-4 rounded-lg text-center space-y-2">
              <p className="text-xs1 font-bold text-sage">تم تغيير كلمة المرور بنجاح!</p>
              <p className="text-xs2 text-frost/80 leading-relaxed">
                يمكنك الآن تسجيل الدخول إلى لوحة التحكم بكلمة المرور الجديدة.
              </p>
            </div>

            <Link
              href="/admin/login"
              className="block w-full bg-brass px-4 py-3.5 text-center text-xs1 tracking-wide2 text-lacquer font-bold rounded-lg
                         transition-colors hover:bg-brass-gilt min-h-[44px]"
            >
              الانتقال لتسجيل الدخول
            </Link>
          </div>
        ) : !hasSession ? (
          <div className="mt-8 space-y-6">
            <div className="border border-garnet bg-garnet/12 px-4 py-4 rounded-lg text-center space-y-2">
              <p className="text-xs1 font-bold text-frost">انتهت صلاحية الرابط أو تم استخدامه مسبقاً</p>
              <p className="text-xs2 text-frost/70 leading-relaxed">
                يرجى طلب رابط استعادة جديد من صفحة تسجيل الدخول.
              </p>
            </div>

            <Link
              href="/admin/login"
              className="block w-full border border-brass/50 bg-brass/10 px-4 py-3 text-center text-xs2 text-brass-gilt rounded-lg
                         transition-colors hover:bg-brass/20"
            >
              العودة لتسجيل الدخول
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <p className="text-xs2 leading-relaxed text-frost/70">
              أدخل كلمة المرور الجديدة لحسابك. يجب أن تتكون من 8 أحرف على الأقل وتضم أرقاماً وحروفاً.
            </p>

            <div>
              <label
                htmlFor="new-pass"
                className="mb-1.5 block text-xs2 tracking-wide2 text-brass"
              >
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  id="new-pass"
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  dir="ltr"
                  className="w-full border border-brass/40 bg-espresso/60 px-3.5 py-3 pe-16
                             text-start text-xs1 text-frost placeholder:text-frost/30
                             focus:border-brass focus:outline-none rounded-lg"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute inset-y-0 end-0 px-3 text-xs2 text-brass
                             hover:text-brass-gilt"
                >
                  {show ? 'إخفاء' : 'إظهار'}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="conf-pass"
                className="mb-1.5 block text-xs2 tracking-wide2 text-brass"
              >
                تأكيد كلمة المرور الجديدة
              </label>
              <input
                id="conf-pass"
                type={show ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                dir="ltr"
                className="w-full border border-brass/40 bg-espresso/60 px-3.5 py-3 pe-16
                           text-start text-xs1 text-frost placeholder:text-frost/30
                           focus:border-brass focus:outline-none rounded-lg"
                placeholder="••••••••"
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="border border-garnet bg-garnet/12 px-3.5 py-2.5 text-xs2 text-frost rounded-lg"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-brass px-4 py-3.5 text-xs1 tracking-wide2 text-lacquer font-bold rounded-lg
                         transition-colors hover:bg-brass-gilt disabled:opacity-50 min-h-[44px]"
            >
              {busy ? 'جاري الحفظ…' : 'حفظ كلمة المرور الجديدة'}
            </button>

            <div className="text-center pt-2">
              <Link href="/admin/login" className="text-xs2 text-brass hover:text-brass-gilt underline">
                إلغاء والعودة لتسجيل الدخول
              </Link>
            </div>
          </form>
        )}

        <p className="mt-8 text-center text-xs2 leading-relaxed text-frost/40">
          هذه الصفحة مخصصة لإدارة المتجر فقط.{' '}
          <Link href="/" className="text-brass underline underline-offset-4">
            العودة للمتجر الرئيسي
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
