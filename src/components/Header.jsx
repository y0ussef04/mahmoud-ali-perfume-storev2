'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { useCart } from '@/lib/cart';

import { egp } from '@/lib/money';
import { settingNum } from '@/lib/totals';

const NAV_LINKS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/products', label: 'الكاتالوج' },
  { href: '/track', label: 'تتبع الطلب' },
];

export default function Header({ settings, announcement = '', freeShipThreshold }) {
  const { count, setOpen } = useCart();
  const pathname = usePathname();

  const threshold = freeShipThreshold ?? settingNum(settings?.free_ship_threshold, 1500);
  const customText = announcement || settings?.announcement || '';
  const shipText = threshold > 0 ? `🚚 شحن مجاني لجميع المحافظات للطلبات بقيمة ${egp(threshold)} فأكثر` : '🚚 شحن مجاني لكل المحافظات';

  return (
    <>
      {/* ══════════════ الشريط الإعلاني المتحرك (Dynamic Marquee Ticker) ══════════════ */}
      <div className="bg-[#1A1814] text-xs py-2 text-[#C9A84C] font-semibold border-b border-[#2E2B22] overflow-hidden select-none">
        <div className="animate-marquee gap-8 items-center whitespace-nowrap">
          <span className="inline-flex items-center gap-6 px-4">
            {customText ? (
              <>
                <span>✨ {customText}</span>
                <span className="text-[#6B6760]">✦</span>
              </>
            ) : null}
            <span>{shipText}</span>
            <span className="text-[#6B6760]">✦</span>
            <span>💵 خيارات دفع مرنة: عند الاستلام، الفيزا، المحافظ، وإنستاباي</span>
            <span className="text-[#6B6760]">✦</span>
            <span>📦 تغليف فاخر وضمان وصول آمن للشحنة</span>
            <span className="text-[#6B6760]">✦</span>
            <span>✨ عطور إماراتية وسعودية أصلية ١٠٠٪ في مصر</span>
          </span>
          <span className="inline-flex items-center gap-6 px-4" aria-hidden="true">
            {customText ? (
              <>
                <span>✨ {customText}</span>
                <span className="text-[#6B6760]">✦</span>
              </>
            ) : null}
            <span>{shipText}</span>
            <span className="text-[#6B6760]">✦</span>
            <span>💵 خيارات دفع مرنة: عند الاستلام، الفيزا، المحافظ، وإنستاباي</span>
            <span className="text-[#6B6760]">✦</span>
            <span>📦 تغليف فاخر وضمان وصول آمن للشحنة</span>
            <span className="text-[#6B6760]">✦</span>
            <span>✨ عطور إماراتية وسعودية أصلية ١٠٠٪ في مصر</span>
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#1C1A14]/90 backdrop-blur-md border-b border-[#E8E6E1] dark:border-[#2E2B22]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo (RTL: Visual Right / End) */}
          <Link href="/" aria-label="الصفحة الرئيسية" className="shrink-0 flex items-center">
            <Logo size={36} tone="onLight" />
          </Link>

          {/* Desktop Nav Links (Center) */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((n) => {
              const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  prefetch={true}
                  aria-current={active ? 'page' : undefined}
                  className={`text-sm font-semibold transition-colors duration-150 relative py-1 ${
                    active
                      ? 'text-[#1A1814] dark:text-white'
                      : 'text-[#6B6760] hover:text-[#1A1814] dark:text-[#A09C94] dark:hover:text-white'
                  }`}
                >
                  {n.label}
                  {active ? (
                    <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#C9A84C] rounded-full" />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {/* Cart & Theme Toggle (RTL: Visual Left / Start) */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="فتح عربة التسوق"
              className="relative inline-flex items-center justify-center gap-2 bg-[#1A1814] hover:bg-[#2D2921] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors duration-150 active:scale-[0.97] min-h-[44px]"
            >
              <span>العربة</span>
              <span className="relative flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {count > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#C9A84C] text-white text-[10px] font-semibold rounded-full flex items-center justify-center num">
                    {count}
                  </span>
                ) : null}
              </span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
