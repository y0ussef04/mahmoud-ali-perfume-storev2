# Component Blueprints & Patterns

Pre-tested, battle-proven component patterns for luxury e-commerce.

---

## 1. Viewport & Overflow Lock (حماية الشاشات الصغيرة ومنع الزووم أوت)

Add to `layout.jsx` and `globals.css` to prevent mobile browsers from zooming out when using wide ambient lighting orbs:

```jsx
// src/app/layout.jsx
export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF8' },
    { media: '(prefers-color-scheme: dark)', color: '#111009' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};
```

```css
/* src/app/globals.css */
html, body {
  overflow-x: hidden;
  max-width: 100vw;
  width: 100%;
  position: relative;
}
```

---

## 2. Compact Trust Bar (شريط المميزات المصغر المتناسق)

A compact 3-column micro-strip that takes less than 55px on mobile, leaving full focus on products:

```jsx
import { ShieldCheck, Truck, Banknote } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';

export function TrustBar() {
  const items = [
    { icon: ShieldCheck, title: 'أصالة ١٠٠٪', desc: 'عطور أصلية ومفحوصة' },
    { icon: Truck, title: 'شحن سريع', desc: 'توصيل آمن لباب بيتك' },
    { icon: Banknote, title: 'الدفع بالاستلام', desc: 'عاين طلبك ثم ادفع' },
  ];

  return (
    <section className="relative z-10 border-b border-[#E8E6E1] dark:border-[#2E2B22] bg-white/70 dark:bg-[#12110C]/80 backdrop-blur-md py-3.5 sm:py-5">
      <div className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
          {items.map((item, idx) => (
            <AnimateIn key={idx} direction="up" delay={0.05 * (idx + 1)} className="w-full">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right gap-1 sm:gap-3.5 p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/85 dark:bg-[#1A1814]/85 border border-[#E8E6E1] dark:border-[#2E2B22] shadow-xs hover:border-[#C9A84C]/40 transition-all duration-300">
                <span className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/25 flex items-center justify-center text-[#C9A84C] shrink-0">
                  <item.icon strokeWidth={1.75} className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </span>
                <div>
                  <p className="text-[10px] sm:text-sm font-bold text-[#1A1814] dark:text-[#F5F5F0]">{item.title}</p>
                  <p className="text-[11px] text-[#8C887B] dark:text-[#A09C94] hidden sm:block mt-0.5">{item.desc}</p>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## 2. Minimalist Icon-Only Cart Badge in Header

A discreet, square-rounded luxury icon matching the theme switcher button:

```jsx
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export function CartIconButton({ count = 0 }) {
  return (
    <Link
      href="/checkout"
      prefetch={true}
      className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white/60 dark:bg-[#1A1814]/60 text-[#1A1814] dark:text-[#F5F5F0] hover:border-[#C9A84C]/50 hover:text-[#C9A84C] dark:hover:text-[#C9A84C] transition-all duration-200"
      aria-label="سلة التسوق"
    >
      <ShoppingBag strokeWidth={1.75} className="w-4 h-4" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C9A84C] px-1 text-[10px] font-bold text-[#12110C] shadow-sm animate-in zoom-in duration-200">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
```

---

## 3. High-Converting 3-Step Checkout Stepper

Clear progress indicator showing: 1. سلة المشتريات -> 2. الشحن والدفع -> 3. تأكيد الطلب

```jsx
import { Check, ShoppingBag, Truck, CheckCircle2 } from 'lucide-react';

export function CheckoutStepper({ currentStep = 2 }) {
  const steps = [
    { num: 1, label: 'سلة المشتريات', icon: ShoppingBag },
    { num: 2, label: 'الشحن والدفع', icon: Truck },
    { num: 3, label: 'تم التأكيد', icon: CheckCircle2 },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 py-4 max-w-lg mx-auto">
      {steps.map((s, idx) => {
        const isDone = currentStep > s.num;
        const isCurrent = currentStep === s.num;
        return (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                isCurrent
                  ? 'bg-[#C9A84C] text-[#12110C] shadow-sm'
                  : isDone
                  ? 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30'
                  : 'bg-black/5 dark:bg-white/5 text-[#8C887B] dark:text-[#6B6760]'
              }`}
            >
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]">
                {isDone ? <Check strokeWidth={2.5} className="w-3.5 h-3.5" /> : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`w-6 sm:w-10 h-0.5 rounded ${
                  currentStep > s.num ? 'bg-[#C9A84C]' : 'bg-[#E8E6E1] dark:bg-[#2E2B22]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

---

## 4. Framed Glass Admin Data Table

Responsive, clean padding, scrollable, with cohesive status badges and action menus:

```jsx
export function FramedAdminTable({ headers, rows }) {
  return (
    <div className="w-full rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white/80 dark:bg-[#1A1814]/80 backdrop-blur-md shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-[#E8E6E1] dark:border-[#2E2B22] bg-[#FAF9F5]/70 dark:bg-[#12110C]/60 text-xs font-semibold text-[#6B6760] dark:text-[#A09C94]">
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3.5 first:pr-6 last:pl-6 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E6E1]/60 dark:divide-[#2E2B22]/60">
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-[#1A1814] dark:text-[#F5F5F0]"
              >
                {row}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 5. Sephora-Style 2-Column Mobile Product Card

Compact, perfectly proportional on mobile with `object-contain` so photos are never cropped:

```jsx
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';

export function LuxuryProductCard({ product: p }) {
  const selectedVariant = p.variants?.[0];
  const url = p.cover || p.images?.[0]?.url;

  return (
    <article className="card group bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col justify-between hover:shadow-md hover:border-[#C9A84C]/50 transition-all duration-200">
      <div>
        <Link href={`/products/${p.slug}`} className="block relative mb-2 sm:mb-3.5 rounded-lg sm:rounded-xl overflow-hidden bg-[#FAF9F5] dark:bg-[#151410]">
          <div className="relative aspect-square sm:aspect-[4/5] w-full flex items-center justify-center p-2 sm:p-3 border border-[#E8E6E1]/60 dark:border-[#2E2B22]/60">
            {url ? (
              <Image
                src={url}
                alt={p.name_ar}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-contain p-1 sm:p-1.5 group-hover:scale-[1.04] transition-transform duration-300"
              />
            ) : null}
          </div>
        </Link>

        <div className="space-y-0.5 sm:space-y-1">
          {p.brand?.name_ar && (
            <p className="text-[10px] sm:text-xs font-semibold text-[#C9A84C] tracking-wide truncate">
              {p.brand.name_ar}
            </p>
          )}
          <h3 className="text-xs sm:text-base font-semibold text-[#1A1814] dark:text-white line-clamp-1 group-hover:text-[#C9A84C] transition-colors">
            <Link href={`/products/${p.slug}`}>{p.name_ar}</Link>
          </h3>
        </div>
      </div>

      <div className="mt-2.5 sm:mt-3.5 pt-2 sm:pt-3 border-t border-[#E8E6E1] dark:border-[#2E2B22] space-y-2">
        <div className="flex items-baseline justify-between gap-1 flex-wrap">
          <span className="text-xs sm:text-base font-bold text-[#1A1814] dark:text-white num">
            {selectedVariant?.price} ج.م
          </span>
          {selectedVariant?.label && (
            <span className="text-[9px] sm:text-[11px] font-medium text-[#6B6760] dark:text-[#A09C94] bg-[#FAFAF8] dark:bg-[#25221B] px-1 sm:px-1.5 py-0.5 rounded border border-[#E8E6E1]/80 dark:border-[#2E2B22]">
              {selectedVariant.label}
            </span>
          )}
        </div>

        <button
          type="button"
          className="w-full bg-gradient-to-r from-[#1A1814] to-[#2D2921] dark:from-[#C9A84C] dark:to-[#8B6914] text-white text-[11px] sm:text-xs font-semibold py-1.5 sm:py-2.5 rounded-lg sm:rounded-full transition-all duration-300 active:scale-[0.97] min-h-[34px] sm:min-h-[40px] flex items-center justify-center gap-1.5 shadow-xs sm:shadow-md"
        >
          <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={1.5} />
          <span>أضف للعربة</span>
        </button>
      </div>
    </article>
  );
}
```

---

## 6. Native Mobile Bottom Nav Dock & Footer Clearance

Bottom bar with safe-area support, and footer copyright bar with bottom padding to avoid overlay:

```jsx
// Mobile Bottom Dock (Fixed at bottom)
<aside
  aria-label="شريط التنقل السفلي"
  className="fixed bottom-0 inset-x-0 z-50 w-full bg-white/95 dark:bg-[#15140F]/95 backdrop-blur-xl border-t border-[#E8E6E1] dark:border-[#2E2B22] md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
  style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
>
  <nav className="h-14 w-full flex items-center justify-around px-1">
    {/* Tabs with flex-1, 10px text, and micro gold dot on active */}
  </nav>
</aside>

// Footer Copyright Bar (Must have pb-24 md:pb-0)
<div className="border-t border-[#2E2B22] bg-[#111009] pb-24 md:pb-0">
  <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A09C94]">
    <p>© {year} {storeName}. جميع الحقوق محفوظة.</p>
  </div>
</div>
```
