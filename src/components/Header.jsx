'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
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
  const shipText = threshold > 0 ? `🚚 شحن مجاني لجميع المحافظات للطلبات بقيمة ${egp(threshold)} فأكثر` : '🚚 شحن مجاني لكل المحافظات';

  // تحكّم كامل في الشريط الإعلاني من لوحة الإدارة
  const isEnabled =
    settings?.announcement_enabled !== false &&
    settings?.announcement_enabled !== 'false' &&
    settings?.announcement_enabled !== 'off' &&
    settings?.announcement_enabled !== 0;

  const customText = (announcement || settings?.announcement || '').trim();
  const mode = settings?.announcement_mode || (customText ? 'custom_and_features' : 'features_only');

  // إخفاء الشريط تماماً لو كان معطلاً أو لو كان وضع النص المخصص فقط والنص فارغ
  const shouldRenderBar = isEnabled && (mode !== 'custom_only' || customText);

  let phrases = [];
  if (mode === 'custom_only') {
    phrases = [customText];
  } else if (mode === 'features_only') {
    phrases = [
      shipText,
      '💵 خيارات دفع مرنة: عند الاستلام، الفيزا، المحافظ، وإنستاباي',
      '📦 تغليف فاخر وضمان وصول آمن للشحنة',
      '✨ عطور إماراتية وسعودية أصلية ١٠٠٪ في مصر',
    ];
  } else {
    // custom_and_features
    phrases = [
      customText ? `✨ ${customText}` : null,
      shipText,
      '💵 خيارات دفع مرنة: عند الاستلام، الفيزا، المحافظ، وإنستاباي',
      '📦 تغليف فاخر وضمان وصول آمن للشحنة',
      '✨ عطور إماراتية وسعودية أصلية ١٠٠٪ في مصر',
    ].filter(Boolean);
  }

  return (
    <>
      {/* ══════════════ الشريط الإعلاني المتحرك (Dynamic Marquee Ticker) ══════════════ */}
      {shouldRenderBar ? (
        <div className="bg-[#1A1814] text-xs py-2 text-[#C9A84C] font-semibold border-b border-[#2E2B22] overflow-hidden select-none">
          <div className="animate-marquee gap-8 items-center whitespace-nowrap">
            <span className="inline-flex items-center gap-6 px-4">
              {phrases.map((phrase, idx) => (
                <span key={idx} className="inline-flex items-center gap-6">
                  <span>{phrase}</span>
                  <span className="text-[#6B6760]">✦</span>
                </span>
              ))}
            </span>
            <span className="inline-flex items-center gap-6 px-4" aria-hidden="true">
              {phrases.map((phrase, idx) => (
                <span key={`dup-${idx}`} className="inline-flex items-center gap-6">
                  <span>{phrase}</span>
                  <span className="text-[#6B6760]">✦</span>
                </span>
              ))}
            </span>
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#1C1A14]/90 backdrop-blur-md border-b border-[#E8E6E1] dark:border-[#2E2B22]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo (RTL: Visual Right / Start) */}
          <div className="flex-1 flex justify-start">
            <Link href="/" aria-label="الصفحة الرئيسية" className="shrink-0 flex items-center">
              <Logo size={36} tone="onLight" />
            </Link>
          </div>

          {/* Desktop Nav Links (Center) */}
          <nav className="hidden md:flex items-center justify-center gap-8">
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

          {/* Cart & Theme Toggle (RTL: Visual Left / End) */}
          <div className="flex-1 flex items-center justify-end gap-2.5">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="سلة المشتريات"
              title="سلة المشتريات"
              className="relative grid h-9 w-9 place-items-center rounded-lg border border-[#E8E6E1] dark:border-[#2E2B22] text-[#1A1814] dark:text-[#F5F2EB] hover:text-[#C9A84C] dark:hover:text-[#C9A84C] hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/10 dark:hover:bg-[#C9A84C]/15 transition-all duration-200 active:scale-95"
            >
              <ShoppingBag strokeWidth={1.6} className="w-4 h-4" />
              {count > 0 ? (
                <span className="absolute -top-1.5 -end-1.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm num">
                  {count}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
