'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mark } from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';

const NAV = [
  { href: '/admin', label: 'نظرة عامة', hint: 'الأرقام والرسوم' },
  { href: '/admin/orders', label: 'الأوردرات', hint: 'المتابعة والتأكيد' },
  { href: '/admin/products', label: 'العطور والمخزون', hint: 'الأسعار والكميات' },
  { href: '/admin/reviews', label: 'آراء العملاء', hint: 'اسكرينات الشات والتقييمات' },
  { href: '/admin/coupons', label: 'أكواد الخصم', hint: 'العروض' },
  { href: '/admin/shipping', label: 'الشحن', hint: 'أسعار المحافظات' },
  { href: '/admin/admins', label: 'مديرو المتجر', hint: 'الحسابات وكلمات المرور' },
];

export default function AdminShell({ admin, pending = 0, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState(null);

  // اقفل القائمة ومؤشر التحميل مع كل تنقّل
  useEffect(() => {
    setOpen(false);
    setNavigatingTo(null);
  }, [pathname]);

  async function signOut() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.replace('/admin/login');
  }

  const nav = (
    <nav className="space-y-1">
      {NAV.map((item) => {
        // /admin نفسه لازم يكون مطابق تام، والباقي بالبادئة
        const active =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);

        const isPending = navigatingTo === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            onMouseEnter={() => router.prefetch(item.href)}
            onClick={() => {
              if (pathname !== item.href) setNavigatingTo(item.href);
            }}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center justify-between gap-2 border-s-2 px-4 py-3
                        transition-colors ${
                          active
                            ? 'border-brass bg-brass/12 text-brass-gilt'
                            : 'border-transparent text-frost/70 hover:bg-white/5 hover:text-frost'
                        } ${isPending ? 'opacity-75 bg-brass/10 border-s-brass animate-pulse' : ''}`}
          >
            <span>
              <span className="block text-xs1 flex items-center gap-1.5">
                {item.label}
                {isPending ? (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-brass animate-ping" />
                ) : null}
              </span>
              <span className="mt-0.5 block text-xs2 text-frost/35">{item.hint}</span>
            </span>

            {item.href === '/admin/orders' && pending > 0 ? (
              <span className="num shrink-0 bg-brass px-2 py-0.5 text-xs2 text-lacquer">
                {pending}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const foot = (
    <div className="border-t border-brass/20 px-4 py-4">
      <p className="truncate text-xs2 text-frost/50" dir="ltr">
        {admin?.full_name || admin?.email}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          className="text-xs2 tracking-wide2 text-brass hover:text-brass-gilt disabled:opacity-50"
        >
          {busy ? 'بيخرج…' : 'خروج'}
        </button>
        <span aria-hidden="true" className="text-brass/30">·</span>
        <Link
          href="/"
          className="text-xs2 tracking-wide2 text-frost/50 hover:text-frost"
        >
          المتجر
        </Link>
      </div>
    </div>
  );

  return (
    // print:block — وقت الطباعة الشريط الجانبي يختفي فمانحتاجش الجريد
    <div className="relative min-h-screen lg:grid lg:grid-cols-[16rem_1fr] print:block">
      {/* ── مؤشر تنقّل فوري رفيع بأعلى الشاشة بلون البراند ── */}
      {navigatingTo ? (
        <div
          role="progressbar"
          aria-label="جاري التحميل"
          className="fixed top-0 inset-x-0 h-[2px] bg-brass shadow-[0_0_8px_rgba(201,168,76,0.8)] z-50 animate-pulse pointer-events-none"
        />
      ) : null}

      {/* ── الشريط الجانبي: ثابت على الشاشات الكبيرة ── */}
      <aside className="no-print hidden bg-lacquer lg:flex lg:h-screen lg:flex-col lg:sticky lg:top-0">
        <div className="flex items-center gap-3 px-4 py-5">
          <Mark size={36} />
          <span className="flex flex-col leading-none">
            <span className="font-mark text-xs2 tracking-wide3 text-brass-gilt">
              MAHMOUD&nbsp;ALI
            </span>
            <span className="mt-1 font-display text-xs2 text-brass">لوحة التحكم</span>
          </span>
          <span className="ms-auto">
            <ThemeToggle />
          </span>
        </div>

        <div className="mt-2 flex-1 overflow-y-auto">{nav}</div>
        {foot}
      </aside>

      {/* ── شريط علوي على الموبايل ── */}
      <div className="no-print lg:hidden">
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-lacquer px-4 py-3">
          <span className="flex items-center gap-2.5">
            <Mark size={30} />
            <span className="font-display text-xs1 text-brass">لوحة التحكم</span>
          </span>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="admin-nav"
              className="border border-brass/40 px-3 py-1.5 text-xs2 tracking-wide2 text-brass"
            >
              {open ? 'اقفل' : 'القائمة'}
              {pending > 0 && !open ? (
                <span className="num ms-2 bg-brass px-1.5 text-lacquer">{pending}</span>
              ) : null}
            </button>
          </div>
        </div>

        {open ? (
          <div id="admin-nav" className="bg-lacquer pb-2">
            {nav}
            {foot}
          </div>
        ) : null}
      </div>

      {/* ── المحتوى ── */}
      <main className="min-w-0 px-4 py-6 sm:px-7 sm:py-9 print:p-0">{children}</main>
    </div>
  );
}
