import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import ReviewsSection from '@/components/ReviewsSection';
import { getProducts, getSettings, getShippingRates } from '@/lib/queries';
import { egp } from '@/lib/money';
import { settingNum } from '@/lib/totals';

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

  const groupedRates = {
    'القاهرة والجيزة والقليوبية': rates.filter((r) => ['القاهرة', 'الجيزة', 'القليوبية'].includes(r.governorate)),
    'محافظات الدلتا والقناة': rates.filter((r) => ['الإسكندرية', 'الشرقية', 'الدقهلية', 'البحيرة', 'الغربية', 'المنوفية', 'دمياط', 'كفر الشيخ', 'الإسماعيلية', 'السويس', 'بورسعيد'].includes(r.governorate)),
    'الصعيد والمحافظات الإقليمية': rates.filter((r) => !['القاهرة', 'الجيزة', 'القليوبية', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'البحيرة', 'الغربية', 'المنوفية', 'دمياط', 'كفر الشيخ', 'الإسماعيلية', 'السويس', 'بورسعيد'].includes(r.governorate)),
  };

  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20 pb-16 md:pb-8">
      {/* ══════════════ 1. الهيرو الفاخر (Premium Hero Section) ══════════════ */}
      <section className="bg-white dark:bg-[#1C1A14] border-b border-[#E8E6E1] dark:border-[#2E2B22] py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/25 px-3.5 py-1 rounded-full text-xs font-semibold text-[#C9A84C]">
            <span>✦ عطور خليجية فاخرة وأصلية ١٠٠٪</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold text-[#1A1814] dark:text-white leading-tight tracking-tight">
            محمود علي للعطور
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-[#6B6760] dark:text-[#A09C94] leading-relaxed max-w-2xl mx-auto">
            روائع العطور الإماراتية والسعودية المختارة بعناية، معروضة بتفاصيلها وأسعارها الشفافة لتمنحك تجربة اقتناء راقية وموثوقة.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/products"
              prefetch={true}
              className="bg-[#1A1814] hover:bg-[#2D2921] dark:bg-[#C9A84C] dark:hover:bg-[#8B6914] text-white rounded-lg px-8 py-3.5 font-semibold text-sm transition-all duration-150 active:scale-[0.97] min-h-[44px] flex items-center justify-center shadow-sm"
            >
              استكشف المجموعة
            </Link>
            <Link
              href="/products?family=set"
              prefetch={true}
              className="border border-[#E8E6E1] dark:border-[#2E2B22] text-[#1A1814] dark:text-white hover:bg-[#FAFAF8] dark:hover:bg-[#25221B] rounded-lg px-8 py-3.5 font-semibold text-sm transition-all duration-150 min-h-[44px] flex items-center justify-center"
            >
              طقم عينات النخبة — {egp(290)}
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════ 2. المنتجات الأكثر طلباً (Featured Products) ══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E8E6E1]/60 dark:border-[#2E2B22]/60 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#1A1814] dark:text-white">
              الأكثر طلباً ورواجاً
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6760] dark:text-[#A09C94] mt-1">
              مختارات من أرقى العطور الخليجية ذات الثبات والفوحان العالي.
            </p>
          </div>
          <Link
            href="/products"
            prefetch={true}
            className="text-xs sm:text-sm font-semibold text-[#C9A84C] hover:underline transition-colors flex items-center gap-1"
          >
            <span>عرض الكل</span>
            <span>←</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ══════════════ 3. شريط الأصالة والمزايا (Trust & Quality Grid) ══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2 text-center sm:text-start">
              <div className="w-10 h-10 rounded-xl bg-[#FAFAF8] dark:bg-[#111009] border border-[#E8E6E1] dark:border-[#2E2B22] flex items-center justify-center text-[#C9A84C] mx-auto sm:mx-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-[#1A1814] dark:text-white">أصالة مضمونة</h3>
              <p className="text-xs text-[#6B6760] dark:text-[#A09C94] leading-relaxed">
                عطور مستوردة أصلياً وموثقة ١٠٠٪ من كبرى الدور الخليجية.
              </p>
            </div>

            <div className="space-y-2 text-center sm:text-start">
              <div className="w-10 h-10 rounded-xl bg-[#FAFAF8] dark:bg-[#111009] border border-[#E8E6E1] dark:border-[#2E2B22] flex items-center justify-center text-[#C9A84C] mx-auto sm:mx-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-[#1A1814] dark:text-white">شحن مجاني</h3>
              <p className="text-xs text-[#6B6760] dark:text-[#A09C94] leading-relaxed">
                تغطية شاملة لكل المحافظات وشحن مجاني للطلبات بقيمة {egp(threshold)} وأكثر.
              </p>
            </div>

            <div className="space-y-2 text-center sm:text-start">
              <div className="w-10 h-10 rounded-xl bg-[#FAFAF8] dark:bg-[#111009] border border-[#E8E6E1] dark:border-[#2E2B22] flex items-center justify-center text-[#C9A84C] mx-auto sm:mx-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-[#1A1814] dark:text-white">دفع مرن وآمن</h3>
              <p className="text-xs text-[#6B6760] dark:text-[#A09C94] leading-relaxed">
                الدفع عند الاستلام نقداً، أو بواسطة البطاقات البنكية، المحافظ، وإنستاباي.
              </p>
            </div>

            <div className="space-y-2 text-center sm:text-start">
              <div className="w-10 h-10 rounded-xl bg-[#FAFAF8] dark:bg-[#111009] border border-[#E8E6E1] dark:border-[#2E2B22] flex items-center justify-center text-[#C9A84C] mx-auto sm:mx-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-[#1A1814] dark:text-white">تغليف فاخر</h3>
              <p className="text-xs text-[#6B6760] dark:text-[#A09C94] leading-relaxed">
                تغليف محكم وعناية خاصة تحفظ ثبات وجودة العطر حتى وصوله إليك.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ 4. آراء وتقييمات العملاء (Customer Reviews) ══════════════ */}
      <ReviewsSection reviews={settings?.customer_reviews} />

      {/* ══════════════ 5. طقم العينات (Discovery Set Banner) ══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-l from-[#1A1814] to-[#2D2921] text-white rounded-2xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 border border-[#C9A84C]/30 shadow-xl">
          <div className="space-y-2 text-center md:text-start">
            <span className="text-xs font-semibold text-[#C9A84C] tracking-wide block">
              تجربة استكشافية مميزة
            </span>
            <h3 className="text-2xl sm:text-3xl font-semibold">طقم عينات عطور النخبة</h3>
            <p className="text-xs sm:text-sm text-[#A09C94] max-w-xl leading-relaxed">
              مجموعة عينات متناغمة تتيح لك اختيار التوليفة العطرية الأنسب لذوقك الخاص بكل ثقة قبل شراء الحجم الكامل.
            </p>
          </div>
          <div className="shrink-0 text-center md:text-end">
            <Link
              href="/products?family=set"
              className="bg-[#C9A84C] hover:bg-[#8B6914] text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2 min-h-[44px]"
            >
              <span>طلب طقم العينات — {egp(290)}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════ 6. تفاصيل الشحن والتوصيل (Progressive Disclosure) ══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#1A1814] dark:text-white">
            الشحن والتوصيل
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6760] dark:text-[#A09C94]">
            توصيل سريع وآمن لجميع المحافظات مع خيارات دفع متعددة.
          </p>
        </div>

        <div className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-2xl p-5 sm:p-7 space-y-6">
          {/* إشعار الشحن المجاني الأنيق */}
          {threshold > 0 ? (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-xs sm:text-sm text-[#2D6A4F] dark:text-emerald-300 font-medium">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>
                شحن مجاني بالكامل لكل طلب بقيمة <span className="num font-bold">{egp(threshold)}</span> أو أكثر إلى أي مكان في مصر.
              </span>
            </div>
          ) : null}

          {/* ملخص المواعيد والمناطق الثلاث */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-[#FAFAF8] dark:bg-[#151410] border border-[#E8E6E1]/70 dark:border-[#2E2B22] space-y-1">
              <div className="font-semibold text-[#1A1814] dark:text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C9A84C]" />
                <span>القاهرة والجيزة والقليوبية</span>
              </div>
              <p className="text-[#6B6760] dark:text-[#A09C94] text-xs leading-relaxed">
                توصيل خلال ٢٤ إلى ٤٨ ساعة عمل.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAFAF8] dark:bg-[#151410] border border-[#E8E6E1]/70 dark:border-[#2E2B22] space-y-1">
              <div className="font-semibold text-[#1A1814] dark:text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C9A84C]" />
                <span>محافظات الدلتا والقناة والإسكندرية</span>
              </div>
              <p className="text-[#6B6760] dark:text-[#A09C94] text-xs leading-relaxed">
                توصيل خلال ٢ إلى ٣ أيام عمل.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAFAF8] dark:bg-[#151410] border border-[#E8E6E1]/70 dark:border-[#2E2B22] space-y-1">
              <div className="font-semibold text-[#1A1814] dark:text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C9A84C]" />
                <span>الصعيد والمحافظات الإقليمية</span>
              </div>
              <p className="text-[#6B6760] dark:text-[#A09C94] text-xs leading-relaxed">
                توصيل خلال ٣ إلى ٥ أيام عمل.
              </p>
            </div>
          </div>

          {/* Progressive Disclosure: جدول تفاصيل المحافظات عند الحاجة */}
          <details className="group border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl overflow-hidden transition-all duration-200">
            <summary className="cursor-pointer px-4 sm:px-5 py-3.5 bg-[#FAFAF8] dark:bg-[#151410] hover:bg-[#F3F1ED] dark:hover:bg-[#201D17] text-xs sm:text-sm font-semibold text-[#1A1814] dark:text-white flex justify-between items-center select-none transition-colors">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>عرض جدول أسعار ومواعيد التوصيل لجميع المحافظات (٢٧ محافظة)</span>
              </span>
              <svg className="w-4 h-4 transition-transform duration-200 group-open:rotate-180 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>

            <div className="p-4 sm:p-5 border-t border-[#E8E6E1] dark:border-[#2E2B22] space-y-4 bg-white dark:bg-[#1C1A14]">
              {Object.entries(groupedRates).map(([groupName, groupItems]) => (
                <div key={groupName} className="space-y-2">
                  <h4 className="text-xs font-semibold text-[#C9A84C]">{groupName}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {groupItems.map((r) => (
                      <div key={r.governorate} className="flex justify-between items-center text-xs p-2 rounded-lg bg-[#FAFAF8] dark:bg-[#151410] border border-[#E8E6E1]/50 dark:border-[#2E2B22]/50">
                        <span className="font-semibold text-[#1A1814] dark:text-white">{r.governorate}</span>
                        <div className="flex items-center gap-2.5 text-[#6B6760] dark:text-[#A09C94]">
                          <span className="num font-semibold text-[#1A1814] dark:text-white">{egp(r.fee)}</span>
                          <span>·</span>
                          <span className="num">{r.days_min}–{r.days_max} أيام</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}

