# Component Blueprints & Patterns

Pre-tested, battle-proven component patterns for luxury e-commerce.

---

## 1. Trust Bar (شريط المميزات المتناسق)

Stacked neatly on mobile, 3-column on desktop, unified card dimensions and RTL icon alignment.

```jsx
import { ShieldCheck, Truck, Banknote } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';

export function TrustBar() {
  const items = [
    {
      icon: ShieldCheck,
      title: 'أصالة مضمونة ١٠٠٪',
      desc: 'منتجات أصلية ومفحوصة بالكامل',
    },
    {
      icon: Truck,
      title: 'شحن سريع لجميع المحافظات',
      desc: 'توصيل آمن حتى باب بيتك',
    },
    {
      icon: Banknote,
      title: 'الدفع عند الاستلام',
      desc: 'عاين طلبك وادفع بكل راحة',
    },
  ];

  return (
    <section className="relative z-10 border-b border-[#E8E6E1] dark:border-[#2E2B22] bg-white/70 dark:bg-[#12110C]/80 backdrop-blur-md py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto">
          {items.map((item, idx) => (
            <AnimateIn key={idx} direction="up" delay={0.1 * (idx + 1)} className="w-full">
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/85 dark:bg-[#1A1814]/85 border border-[#E8E6E1] dark:border-[#2E2B22] shadow-xs hover:border-[#C9A84C]/40 hover:shadow-md transition-all duration-300">
                <span className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/25 flex items-center justify-center text-[#C9A84C] shrink-0">
                  <item.icon strokeWidth={1.75} className="w-5 h-5" />
                </span>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-bold text-[#1A1814] dark:text-[#F5F5F0]">{item.title}</p>
                  <p className="text-[11px] text-[#8C887B] dark:text-[#A09C94] mt-0.5">{item.desc}</p>
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
