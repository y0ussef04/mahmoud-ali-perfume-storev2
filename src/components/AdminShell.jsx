'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mark } from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';

const NAV = [
  { href: '/admin', label: 'نظرة عامة', hint: 'الأرقام والرسوم', perm: 'dashboard.view' },
  { href: '/admin/orders', label: 'الأوردرات', hint: 'المتابعة والتأكيد', perm: 'orders.view' },
  { href: '/admin/products', label: 'العطور والمخزون', hint: 'الأسعار والكميات', perm: 'products.view' },
  { href: '/admin/reviews', label: 'آراء العملاء', hint: 'اسكرينات الشات والتقييمات', perm: 'products.view' },
  { href: '/admin/coupons', label: 'أكواد الخصم', hint: 'العروض', perm: 'coupons.view' },
  { href: '/admin/shipping', label: 'الشحن والإعدادات', hint: 'أسعار الشحن والشريط المتحرك', perm: 'shipping.view' },
  { href: '/admin/admins', label: 'مديرو المتجر', hint: 'الحسابات والصلاحيات', perm: 'admins.view' },
];

export default function AdminShell({ admin, pending = 0, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState(null);

  const isManager = admin?.role === 'manager';

  // تصفية القائمة بحسب الصلاحيات
  const visibleNav = NAV.filter((item) => {
    if (isManager) return true;
    if (!item.perm) return true;
    return Array.isArray(admin?.permissions) && admin.permissions.includes(item.perm);
  });

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
      {visibleNav.map((item) => {
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
    <div className="border-t border-brass/20 px-4 py-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-xs1 text-frost truncate">
          {admin?.full_name || (isManager ? 'المدير العام' : 'مشرف')}
        </span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
            isManager
              ? 'bg-brass/20 text-brass-light border border-brass/40'
              : 'bg-white/10 text-frost/80 border border-white/20'
          }`}
        >
          {isManager ? 'مدير عام' : 'مشرف'}
        </span>
      </div>
      <p className="truncate text-xs2 text-frost/50 font-mono" dir="ltr">
        {admin?.email}
      </p>
      <div className="pt-2 flex items-center gap-3">
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
    <div className="relative min-h-screen lg:grid lg:grid-cols-[16rem_1fr] print:block">
      {navigatingTo ? (
        <div
          role="progressbar"
          aria-label="جاري التحميل"
          className="fixed top-0 inset-x-0 h-[2px] bg-brass shadow-[0_0_8px_rgba(201,168,76,0.8)] z-50 animate-pulse pointer-events-none"
        />
      ) : null}

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

      <main className="min-w-0 px-4 py-6 sm:px-7 sm:py-9 print:p-0">{children}</main>
    </div>
  );
}
