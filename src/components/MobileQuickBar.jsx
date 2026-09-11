'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart';

export default function MobileQuickBar({ waNumber = '201000000000' }) {
  const pathname = usePathname();
  const { count, setOpen } = useCart();

  const formattedWa = waNumber ? waNumber.replace(/\D/g, '') : '201000000000';
  const waUrl = `https://wa.me/${formattedWa}?text=${encodeURIComponent('أهلاً محمود، محتاج استفسار عن العطور المتاحة')}`;

  const tabs = [
    {
      id: 'home',
      label: 'الرئيسية',
      href: '/',
      active: pathname === '/',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'catalog',
      label: 'الكاتالوج',
      href: '/products',
      active: pathname.startsWith('/products'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: 'cart',
      label: 'العربة',
      onClick: () => setOpen(true),
      active: false,
      badge: count,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      id: 'track',
      label: 'تتبع',
      href: '/track',
      active: pathname.startsWith('/track'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1e1 1 0 011 1h2l4 4v5a1 1 0 01-1 1h-1m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'whatsapp',
      label: 'واتساب',
      href: waUrl,
      external: true,
      active: false,
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.146 4.185 4.189-1.098z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-[#1C1A14]/95 backdrop-blur-md border-t border-[#E8E6E1] dark:border-[#2E2B22] md:hidden h-16 pb-safe">
      <nav className="h-full max-w-md mx-auto grid grid-cols-5 items-center px-1">
        {tabs.map((t) => {
          const content = (
            <span className="flex flex-col items-center justify-center gap-1">
              <span className="relative">
                {t.icon}
                {t.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#C9A84C] text-white text-[10px] font-semibold rounded-full flex items-center justify-center num">
                    {t.badge}
                  </span>
                ) : null}
              </span>
              <span className="text-[11px] font-semibold leading-none">{t.label}</span>
            </span>
          );

          const className = `flex flex-col items-center justify-center h-full min-h-[44px] transition-colors duration-150 active:scale-[0.95] ${
            t.active
              ? 'text-[#1A1814] dark:text-white font-semibold'
              : 'text-[#6B6760] dark:text-[#A09C94] hover:text-[#1A1814]'
          }`;

          if (t.onClick) {
            return (
              <button key={t.id} type="button" onClick={t.onClick} className={className}>
                {content}
              </button>
            );
          }

          if (t.external) {
            return (
              <a key={t.id} href={t.href} target="_blank" rel="noopener noreferrer" className={className}>
                {content}
              </a>
            );
          }

          return (
            <Link key={t.id} href={t.href} prefetch={true} className={className}>
              {content}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
