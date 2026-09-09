'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mark } from '@/components/Logo';

/** ترجمة رسايل Supabase للعربي — رسايلها بالإنجليزي وتقنية */
function arError(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'الإيميل أو الباسورد غلط.';
  if (m.includes('email not confirmed')) return 'الإيميل لسه مش مؤكَّد. افتح رسالة التأكيد.';
  if (m.includes('too many requests') || m.includes('rate limit'))
    return 'محاولات كتير. استنى شوية وجرّب تاني.';
  if (m.includes('failed to fetch') || m.includes('network'))
    return 'مافيش اتصال بالسيرفر. اتأكّد من الإنترنت.';
  return msg || 'مانفعش الدخول. جرّب تاني.';
}

export default function AdminLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const denied = params.get('denied') === '1';
  const next = params.get('next') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(arError(authError.message));
        setBusy(false);
        return;
      }

      // السيرفر لازم يشوف الكوكي الجديدة قبل التنقّل
      router.refresh();
      // مسار داخلي بس — مانسمحش بإعادة توجيه لبره الموقع
      router.replace(next.startsWith('/admin') ? next : '/admin');
    } catch (err) {
      setError(arError(err?.message));
      setBusy(false);
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-lacquer px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Mark size={64} />
          <h1 className="mt-6 font-display text-d3 text-frost">لوحة التحكم</h1>
          <p className="mt-2 text-xs2 tracking-wide2 text-brass">
            Mahmoud-Ali&apos;s store
          </p>
        </div>

        {denied ? (
          <div className="mt-8 border border-garnet bg-garnet/12 px-4 py-3.5">
            <p className="text-xs1 leading-relaxed text-frost">
              الحساب ده مسجّل دخول بس مش من الأدمن. لو ده حسابك الصح، لازم يتضاف
              في جدول <span className="font-mark">admins</span> الأول.
            </p>
            <button
              type="button"
              onClick={signOut}
              className="mt-3 text-xs2 tracking-wide2 text-brass-gilt underline underline-offset-4"
            >
              اخرج وسجّل بحساب تاني
            </button>
          </div>
        ) : null}

        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="a-email"
              className="mb-1.5 block text-xs2 tracking-wide2 text-brass"
            >
              الإيميل
            </label>
            <input
              id="a-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              dir="ltr"
              className="w-full border border-brass/40 bg-espresso/60 px-3.5 py-3 text-start
                         text-xs1 text-frost placeholder:text-frost/30
                         focus:border-brass focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="a-pass"
              className="mb-1.5 block text-xs2 tracking-wide2 text-brass"
            >
              الباسورد
            </label>
            <div className="relative">
              <input
                id="a-pass"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                dir="ltr"
                className="w-full border border-brass/40 bg-espresso/60 px-3.5 py-3 pe-16
                           text-start text-xs1 text-frost placeholder:text-frost/30
                           focus:border-brass focus:outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute inset-y-0 end-0 px-3 text-xs2 text-brass
                           hover:text-brass-gilt"
              >
                {show ? 'اخفي' : 'اظهر'}
              </button>
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="border border-garnet bg-garnet/12 px-3.5 py-2.5 text-xs2 text-frost"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-brass px-4 py-3.5 text-xs1 tracking-wide2 text-lacquer
                       transition-colors hover:bg-brass-gilt disabled:opacity-50"
          >
            {busy ? 'بيتحقّق…' : 'دخول'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs2 leading-relaxed text-frost/40">
          الصفحة دي للإدارة بس. لو وصلتها بالغلط،{' '}
          <Link href="/" className="text-brass underline underline-offset-4">
            ارجع للمتجر
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
