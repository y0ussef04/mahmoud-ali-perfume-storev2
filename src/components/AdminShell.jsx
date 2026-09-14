'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  MessageSquareQuote,
  Tag,
  Truck,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  ExternalLink,
  User,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Mark } from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';

const NAV = [
  { href: '/admin', label: 'نظرة عامة', hint: 'الأرقام والرسوم', perm: 'dashboard.view', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'الأوردرات', hint: 'المتابعة والتأكيد', perm: 'orders.view', icon: ShoppingBag },
  { href: '/admin/products', label: 'العطور والمخزون', hint: 'الأسعار والكميات', perm: 'products.view', icon: Package },
  { href: '/admin/reviews', label: 'آراء العملاء', hint: 'اسكرينات الشات والتقييمات', perm: 'products.view', icon: MessageSquareQuote },
  { href: '/admin/coupons', label: 'أكواد الخصم', hint: 'العروض', perm: 'coupons.view', icon: Tag },
  { href: '/admin/shipping', label: 'الشحن والإعدادات', hint: 'أسعار الشحن والشريط المتحرك', perm: 'shipping.view', icon: Truck },
  { href: '/admin/admins', label: 'مديرو المتجر', hint: 'الحسابات والصلاحيات', perm: 'admins.view', icon: ShieldCheck },
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
    <nav className="space-y-1.5 px-3">
      {visibleNav.map((item) => {
        const Icon = item.icon;
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
            className={`group relative flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 ${
              active
                ? 'bg-gradient-to-r from-[#C9A84C]/25 to-[#C9A84C]/10 text-[#C9A84C] font-semibold border border-[#C9A84C]/30 shadow-sm'
                : 'text-[#FAF9F5]/70 hover:text-white hover:bg-white/[0.06] border border-transparent'
            } ${isPending ? 'opacity-75 animate-pulse' : ''}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  active ? 'text-[#C9A84C]' : 'text-[#FAF9F5]/50 group-hover:text-white'
                }`}
                strokeWidth={1.75}
              />
              <div className="truncate">
                <span className="block text-xs font-semibold leading-tight flex items-center gap-1.5">
                  {item.label}
                  {isPending ? (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-ping" />
                  ) : null}
                </span>
                <span className="mt-0.5 block text-[11px] text-[#FAF9F5]/40 truncate">
                  {item.hint}
                </span>
              </div>
            </div>

            {item.href === '/admin/orders' && pending > 0 ? (
              <span className="num shrink-0 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E5C773] text-[#1A1814] font-bold text-[11px] px-2 py-0.5 shadow-sm">
                {pending}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const foot = (
    <div className="border-t border-[#C9A84C]/15 px-4 py-4 space-y-3 bg-black/20">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center shrink-0 text-[#C9A84C]">
            <User className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="font-semibold text-xs text-white truncate block">
              {admin?.full_name || (isManager ? 'المدير العام' : 'مشرف')}
            </span>
            <p className="truncate text-[10px] text-[#FAF9F5]/50 font-mono" dir="ltr">
              {admin?.email}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isManager
              ? 'bg-[#C9A84C]/20 text-[#E5C773] border border-[#C9A84C]/40'
              : 'bg-white/10 text-white/80 border border-white/20'
          }`}
        >
          {isManager ? 'مدير عام' : 'مشرف'}
        </span>
      </div>

      <div className="pt-2 flex items-center justify-between border-t border-white/5 text-xs">
        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-xs text-[#C9A84C] hover:text-[#E5C773] disabled:opacity-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{busy ? 'جاري الخروج…' : 'تسجيل الخروج'}</span>
        </button>

        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1 text-xs text-[#FAF9F5]/50 hover:text-white transition-colors"
        >
          <span>المتجر</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[17rem_1fr] print:block bg-[#FBFBF9] dark:bg-[#12110F] text-[#1A1814] dark:text-[#F5F2EB]">
      {navigatingTo ? (
        <div
          role="progressbar"
          aria-label="جاري التحميل"
          className="fixed top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#C9A84C] via-[#E5C773] to-[#C9A84C] shadow-[0_0_10px_rgba(201,168,76,0.8)] z-50 animate-pulse pointer-events-none"
        />
      ) : null}

      {/* شريط المنيو الجانبي للشاشات الكبيرة */}
      <aside className="no-print hidden bg-[#1A1814] border-e border-[#2A2720] lg:flex lg:h-screen lg:flex-col lg:sticky lg:top-0">
        <div className="flex items-center gap-3 px-5 py-6 border-b border-[#2A2720]">
          <Mark size={36} />
          <div className="flex flex-col leading-none">
            <span className="font-mark text-xs tracking-widest text-[#E5C773] font-bold">
              MAHMOUD ALI
            </span>
            <span className="mt-1 font-display text-[11px] text-[#C9A84C]">لوحة التحكم</span>
          </div>
          <div className="ms-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto py-2">{nav}</div>
        {foot}
      </aside>

      {/* شريط التنقل للهواتف */}
      <div className="no-print lg:hidden">
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-[#1A1814] border-b border-[#2A2720] px-4 py-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <Mark size={30} />
            <span className="font-display text-xs font-bold text-[#E5C773]">لوحة التحكم</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="admin-nav"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-3 py-1.5 text-xs font-semibold text-[#E5C773] active:scale-95 transition-all"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span>{open ? 'إغلاق' : 'القائمة'}</span>
              {pending > 0 && !open ? (
                <span className="num ms-1 rounded-full bg-[#C9A84C] text-[#1A1814] px-1.5 py-0.2 text-[10px] font-bold">
                  {pending}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {open ? (
          <div id="admin-nav" className="bg-[#1A1814] border-b border-[#2A2720] shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="py-3">{nav}</div>
            {foot}
          </div>
        ) : null}
      </div>

      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8 print:p-0">{children}</main>
    </div>
  );
}
