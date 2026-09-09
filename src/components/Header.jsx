'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { useCart } from '@/lib/cart';

const NAV = [
  { href: '/', label: 'الرئيسية' },
  { href: '/products', label: 'كل العطور' },
  { href: '/track', label: 'تتبع أوردر' },
];

export default function Header({ announcement = '' }) {
  const { count, setOpen } = useCart();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);

  return (
    <>
      {announcement ? (
        <div className="bg-lacquer text-center text-xs2 tracking-wide2 text-brass-gilt">
          <p className="mx-auto max-w-wrap px-4 py-2">{announcement}</p>
        </div>
      ) : null}

      <header className="sticky top-0 z-40 border-b border-hair bg-lacquer/95 backdrop-blur">
        <div className="mx-auto flex max-w-wrap items-center gap-4 px-4 py-3">
          <Link href="/" aria-label="الرئيسية" className="shrink-0">
            <Logo size={40} tone="onDark" />
          </Link>

          {/* التنقّل — شاشات كبيرة */}
          <nav className="mx-auto hidden items-center gap-1 md:flex">
            {NAV.map((n) => {
              const on = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={on ? 'page' : undefined}
                  className={`px-4 py-2 text-xs1 tracking-wide2 transition-colors ${
                    on
                      ? 'text-brass-gilt'
                      : 'text-brass/70 hover:text-brass-gilt'
                  }`}
                >
                  {n.label}
                  {on ? (
                    <span className="mt-1.5 block h-px bg-brass-gilt" aria-hidden="true" />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="ms-auto flex items-center gap-2 md:ms-0">
            {/* تبديل الثيم */}
            <ThemeToggle />

            {/* العربة */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative border border-brass/45 px-4 py-2 text-xs1 tracking-wide2
                         text-brass-gilt transition-colors hover:bg-brass/15"
              style={{ borderRadius: 2 }}
            >
              العربة
              <span
                aria-hidden={count === 0}
                className={`ms-2 inline-block min-w-6 border border-brass/45 px-1.5 text-xs2 num ${
                  count > 0 ? 'bg-brass-gilt text-lacquer' : 'text-brass/60'
                }`}
              >
                {count}
              </span>
              <span className="sr-only">
                {count > 0 ? `${count} قطعة في العربة` : 'العربة فاضية'}
              </span>
            </button>

            {/* زر القائمة — موبايل */}
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              aria-expanded={menu}
              aria-label="القائمة"
              className="border border-brass/45 px-3 py-2 text-brass-gilt md:hidden"
              style={{ borderRadius: 2 }}
            >
              <span className="block h-px w-5 bg-current" />
              <span className="mt-1.5 block h-px w-5 bg-current" />
              <span className="mt-1.5 block h-px w-5 bg-current" />
            </button>
          </div>
        </div>

        {/* التنقّل — موبايل */}
        {menu ? (
          <nav className="border-t border-brass/25 md:hidden">
            {NAV.map((n) => {
              const on = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={on ? 'page' : undefined}
                  onClick={() => setMenu(false)}
                  className={`block border-b border-brass/15 px-5 py-3.5 text-xs1
                             tracking-wide2 transition-colors ${
                    on ? 'text-brass-gilt' : 'text-brass/70 hover:text-brass-gilt'
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </header>
    </>
  );
}
