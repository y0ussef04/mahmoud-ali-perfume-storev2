/*
 * DESIGN DECISIONS:
 * Layout: Redesigned homepage aligned with design tokens (#FAFAF8 background, #1A1814 primary text, #C9A84C gold CTA).
 * Mobile: Accordion shipping info instead of cramped table, stacked payment cards, bottom WhatsApp FAB.
 * Removed: Emoji icons, 01/02/03 step number decorations, text gradient headers, texture dots.
 * RTL notes: Using start/end border dividers, price format X ج.م, RTL directional text flow.
 */

import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import ReviewsSection from '@/components/ReviewsSection';
import Logo from '@/components/Logo';
import { SpineKey } from '@/components/Spine';
import { getProducts, getSettings, getShippingRates } from '@/lib/queries';
import { egp, num } from '@/lib/money';
import { settingNum } from '@/lib/totals';
import { COUNTRY } from '@/lib/labels';

export const revalidate = 60;

export default async function HomePage() {
  const [products, settings, rates] = await Promise.all([
    getProducts(),
    getSettings(),
    getShippingRates(),
  ]);

  const featured = products.filter((p) => p.is_featured).slice(0, 8);
  const list = featured.length ? featured : products.slice(0, 8);

  const threshold = settingNum(settings.free_ship_threshold, 1500);
  const codFee = settingNum(settings.cod_fee, 15);
  const cheapestShip = rates.length ? Math.min(...rates.map((r) => Number(r.fee))) : null;

  const brandsCount = new Set(products.map((p) => p.brand?.slug)).size;

  const waNumber = (settings.wa_number || '201000000000').replace(/\D/g, '');
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent('أهلاً محمود، محتاج استفسار عن العطور المتاحة')}`;

  // تجميع المحافظات في مجموعات للموبايل
  const groupedRates = {
    'القاهرة والجيزة والقليوبية': rates.filter((r) => ['القاهرة', 'الجيزة', 'القليوبية'].includes(r.governorate)),
    'محافظات الدلتا والقناة': rates.filter((r) => ['الإسكندرية', 'الشرقية', 'الدقهلية', 'البحيرة', 'الغربية', 'المنوفية', 'دمياط', 'كفر الشيخ', 'الإسماعيلية', 'السويس', 'بورسعيد'].includes(r.governorate)),
    'الصعيد والمحافظات النائية': rates.filter((r) => !['القاهرة', 'الجيزة', 'القليوبية', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'البحيرة', 'الغربية', 'المنوفية', 'دمياط', 'كفر الشيخ', 'الإسماعيلية', 'السويس', 'بورسعيد'].includes(r.governorate)),
  };

  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20 pb-20 md:pb-8">
      {/* ══════════════ 1. الهيرو ══════════════ */}
      <section className="bg-white dark:bg-[#1C1A14] border-b border-[#E8E6E1] dark:border-[#2E2B22] py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center p-2 rounded-full bg-[#FAFAF8] dark:bg-[#111009] border border-[#E8E6E1] dark:border-[#2E2B22]">
            <Logo size={44} tone="onLight" />
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-semibold text-[#C9A84C] tracking-wide block">
              عطور إماراتية وسعودية أصلية ١٠٠٪ في مصر
            </span>
            <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A1814] dark:text-white leading-tight">
              محمود علي للعطور
            </h1>
            <p className="text-base text-[#6B6760] dark:text-[#A09C94] leading-relaxed max-w-xl mx-auto">
              كاتالوج كامل بأسعار وأحجام واضحة لجميع العطور. تطلب في دقيقة وبدون الحاجة للسؤال في الرسائل الخاصة.
            </p>
          </div>

          {/* أزرار الإجراءات — الحد الأقصى 2 CTA ذهبي */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/products"
              className="bg-[#C9A84C] hover:bg-[#8B6914] text-white rounded-lg px-6 py-3 font-semibold text-sm transition-colors duration-150 active:scale-[0.97] min-h-[44px] flex items-center justify-center"
            >
              استكشف الكاتالوج بالأسعار
            </Link>
            <Link
              href="/products?family=set"
              className="border border-[#E8E6E1] dark:border-[#2E2B22] text-[#1A1814] dark:text-white hover:bg-[#FAFAF8] dark:hover:bg-[#111009] rounded-lg px-6 py-3 font-semibold text-sm transition-colors duration-150 min-h-[44px] flex items-center justify-center"
            >
              طقم عينات بـ {egp(290)}
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════ 2. إحصائيات الهيرو ══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-6">
          <div className="grid grid-cols-3 divide-x divide-x-reverse divide-[#E8E6E1] dark:divide-[#2E2B22] text-center">
            <div className="px-2">
              <span className="block text-xl sm:text-2xl font-semibold text-[#1A1814] dark:text-white num">
                {num(products.length)}
              </span>
              <span className="text-xs text-[#6B6760] dark:text-[#A09C94] mt-1 block">
                عطر في الكاتالوج
              </span>
            </div>
            <div className="px-2">
              <span className="block text-xl sm:text-2xl font-semibold text-[#1A1814] dark:text-white num">
                {num(brandsCount)}
              </span>
              <span className="text-xs text-[#6B6760] dark:text-[#A09C94] mt-1 block">
                بيت عطور خليجي
              </span>
            </div>
            <div className="px-2">
              <span className="block text-xl sm:text-2xl font-semibold text-[#1A1814] dark:text-white num">
                {num(rates.length)}
              </span>
              <span className="text-xs text-[#6B6760] dark:text-[#A09C94] mt-1 block">
                محافظة نغطيها
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ 3. خطوات الطلب ══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#1A1814] dark:text-white">
              كيف تقوم بالطلب؟
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6760] dark:text-[#A09C94]">
              ثلاث خطوات سهلة ومباشرة بدون تعقيد أو تسجيل حساب.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-5 sm:p-6 space-y-2">
              <h3 className="text-base font-semibold text-[#1A1814] dark:text-white">١. اختر العطر والحجم</h3>
              <p className="text-xs sm:text-sm text-[#6B6760] dark:text-[#A09C94] leading-relaxed">
                كل عطر معروض بأسعار أحجامه المتاحة فوراً. أضف الحجم المناسب للعربة مباشرة.
              </p>
            </div>

            <div className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-5 sm:p-6 space-y-2">
              <h3 className="text-base font-semibold text-[#1A1814] dark:text-white">٢. حدد عنوان التوصيل</h3>
              <p className="text-xs sm:text-sm text-[#6B6760] dark:text-[#A09C94] leading-relaxed">
                ادخل رقم موبايلك وعنوانك. يتم احتساب تكلفة الشحن ومدة التوصيل تلقائياً حسب محافظتك.
              </p>
            </div>

            <div className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-5 sm:p-6 space-y-2">
              <h3 className="text-base font-semibold text-[#1A1814] dark:text-white">٣. اختر طريقة الدفع</h3>
              <p className="text-xs sm:text-sm text-[#6B6760] dark:text-[#A09C94] leading-relaxed">
                ادفع عند الاستلام كاش للمندوب، أو عبر الفيزا والمحفظة أو تحويل إنستاباي.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ 4. المنتجات المعتمدة ══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#1A1814] dark:text-white">
              العطور الأكثر طلباً
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6760] dark:text-[#A09C94] mt-1">
              أشهر العطور الخليجية المطلوبة في مصر بالأصل والضمان.
            </p>
          </div>
          <Link
            href="/products"
            className="text-xs sm:text-sm font-semibold text-[#1A1814] dark:text-white underline hover:text-[#C9A84C] transition-colors"
          >
            عرض جميع العطور ➔
          </Link>
        </div>

        {/* شبكة الكروت: 2 للموبايل / 3 للتابلت / 4 للكمبيوتر */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ══════════════ 5. آراء العملاء ══════════════ */}
      <ReviewsSection reviews={settings?.customer_reviews} />

      {/* ══════════════ 6. الشحن (جدول كمبيوتر / آكوردين موبايل) ══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#1A1814] dark:text-white">
            تفاصيل ومصاريف الشحن
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6760] dark:text-[#A09C94]">
            أسعار التوصيل الشفافة لكل محافظة في مصر.
          </p>
        </div>

        <div className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-5 sm:p-6 space-y-6">
          {threshold > 0 ? (
            <div className="flex items-center gap-3 p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-xs sm:text-sm text-[#2D6A4F] font-semibold">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>
                شحن مجاني بالكامل لأي أوردر بقيمة <span className="num font-bold">{egp(threshold)}</span> فأكثر!
              </span>
            </div>
          ) : null}

          {/* ── Mobile Accordion ── */}
          <div className="md:hidden space-y-3">
            {Object.entries(groupedRates).map(([groupName, groupItems]) => (
              <details key={groupName} className="group border border-[#E8E6E1] dark:border-[#2E2B22] rounded-lg">
                <summary className="cursor-pointer px-4 py-3 text-xs sm:text-sm font-semibold text-[#1A1814] dark:text-white flex justify-between items-center select-none">
                  <span>{groupName}</span>
                  <svg className="w-4 h-4 transition-transform duration-150 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-4 pb-3 pt-1 border-t border-[#E8E6E1] dark:border-[#2E2B22] space-y-2">
                  {groupItems.map((r) => (
                    <div key={r.governorate} className="flex justify-between items-center text-xs py-1">
                      <span className="font-semibold text-[#1A1814] dark:text-white">{r.governorate}</span>
                      <div className="flex items-center gap-3 text-[#6B6760]">
                        <span className="num font-semibold text-[#1A1814] dark:text-white">{egp(r.fee)}</span>
                        <span className="num">{r.days_min}–{r.days_max} أيام</span>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>

          {/* ── Desktop Full Table ── */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-[#E8E6E1] dark:border-[#2E2B22]">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-[#FAFAF8] dark:bg-[#111009] border-b border-[#E8E6E1] dark:border-[#2E2B22] sticky top-0">
                <tr>
                  <th className="py-3 px-4 text-start font-semibold text-[#1A1814] dark:text-white">المحافظة</th>
                  <th className="py-3 px-4 text-start font-semibold text-[#1A1814] dark:text-white">تكلفة الشحن</th>
                  <th className="py-3 px-4 text-start font-semibold text-[#1A1814] dark:text-white">مدة التوصيل المتوقعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6E1] dark:divide-[#2E2B22]">
                {rates.map((r, i) => (
                  <tr key={r.governorate} className={i % 2 === 0 ? 'bg-white dark:bg-[#1C1A14]' : 'bg-[#FAFAF8] dark:bg-[#111009]'}>
                    <td className="py-3 px-4 font-semibold text-[#1A1814] dark:text-white">{r.governorate}</td>
                    <td className="py-3 px-4 num font-semibold text-[#1A1814] dark:text-white">{egp(r.fee)}</td>
                    <td className="py-3 px-4 num text-[#6B6760] dark:text-[#A09C94]">{r.days_min} – {r.days_max} أيام عمل</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════════ 7. طرق الدفع ══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#1A1814] dark:text-white">
            طرق الدفع المتاحة
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6760] dark:text-[#A09C94]">
            خيارات دفع آمنة تناسب رغبتك.
          </p>
        </div>

        {/* Mobile: Stacked cards / Desktop: 3 equal columns */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-5 bg-white dark:bg-[#1C1A14] space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#FAFAF8] dark:bg-[#111009] border border-[#E8E6E1] dark:border-[#2E2B22] flex items-center justify-center text-[#1A1814] dark:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-[#1A1814] dark:text-white">الدفع عند الاستلام</h3>
            <p className="text-xs sm:text-sm text-[#6B6760] dark:text-[#A09C94] leading-relaxed">
              ادفع كاش للمندوب عند استلام الأوردر. رسم تحصيل تحصيل بسيط ({egp(codFee)}).
            </p>
          </div>

          <div className="border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-5 bg-white dark:bg-[#1C1A14] space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#FAFAF8] dark:bg-[#111009] border border-[#E8E6E1] dark:border-[#2E2B22] flex items-center justify-center text-[#1A1814] dark:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-[#1A1814] dark:text-white">بطاقة بنكية / محفظة</h3>
            <p className="text-xs sm:text-sm text-[#6B6760] dark:text-[#A09C94] leading-relaxed">
              فيزا، ماستركارد، أو المحافظ الإلكترونية. تأكيد فوري للأوردر.
            </p>
          </div>

          <div className="border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-5 bg-white dark:bg-[#1C1A14] space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#FAFAF8] dark:bg-[#111009] border border-[#E8E6E1] dark:border-[#2E2B22] flex items-center justify-center text-[#1A1814] dark:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-[#1A1814] dark:text-white">إنستاباي / فودافون كاش</h3>
            <p className="text-xs sm:text-sm text-[#6B6760] dark:text-[#A09C94] leading-relaxed">
              تحويل مباشر على الرقم المخصص وارسال إيصال التحويل لتأكيد الطلب.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════ WhatsApp FAB (Mobile Only) ══════════════ */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تواصل عبر واتساب"
        className="md:hidden fixed bottom-20 end-4 z-40 w-13 h-13 min-w-[52px] min-h-[52px] rounded-full bg-[#25D366] hover:bg-[#1EA855] text-white shadow-lg shadow-green-900/20 flex items-center justify-center transition-transform active:scale-95"
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.146 4.185 4.189-1.098z" />
        </svg>
      </a>
    </div>
  );
}
