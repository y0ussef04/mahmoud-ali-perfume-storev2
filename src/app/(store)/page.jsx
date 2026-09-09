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

  const waNumber = (settings.wa_number || '201000000000').replace(/\D/g, '');
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent('السلام عليكم، يرجى التكرم بإفادتي حول العطور المتاحة')}`;

  const groupedRates = {
    'القاهرة والجيزة والقليوبية': rates.filter((r) => ['القاهرة', 'الجيزة', 'القليوبية'].includes(r.governorate)),
    'محافظات الدلتا والقناة': rates.filter((r) => ['الإسكندرية', 'الشرقية', 'الدقهلية', 'البحيرة', 'الغربية', 'المنوفية', 'دمياط', 'كفر الشيخ', 'الإسماعيلية', 'السويس', 'بورسعيد'].includes(r.governorate)),
    'الصعيد والمحافظات النائية': rates.filter((r) => !['القاهرة', 'الجيزة', 'القليوبية', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'البحيرة', 'الغربية', 'المنوفية', 'دمياط', 'كفر الشيخ', 'الإسماعيلية', 'السويس', 'بورسعيد'].includes(r.governorate)),
  };

  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20 pb-20 md:pb-8">
      {/* ══════════════ 1. الهيرو (Hero Section) ══════════════ */}
      <section className="bg-white dark:bg-[#1C1A14] border-b border-[#E8E6E1] dark:border-[#2E2B22] py-14 sm:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs font-semibold text-[#C9A84C] tracking-widest uppercase block">
            فخامة العطور الخليجية
          </span>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold text-[#1A1814] dark:text-white leading-tight tracking-tight">
            محمود علي للعطور
          </h1>

          <p className="text-base sm:text-lg text-[#6B6760] dark:text-[#A09C94] leading-relaxed max-w-2xl mx-auto">
            تشكيلة استثنائية من دور العطور الإماراتية والسعودية الأصلية، معروضة بتفاصيلها وأسعارها الشفافة لتمنحك تجربة اقتناء فاخرة وموثوقة.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href="/products"
              className="bg-[#C9A84C] hover:bg-[#8B6914] text-white rounded-lg px-8 py-3.5 font-semibold text-sm transition-colors duration-150 active:scale-[0.97] min-h-[44px] flex items-center justify-center shadow-sm"
            >
              استكشف المجموعة
            </Link>
            <Link
              href="/products?family=set"
              className="border border-[#E8E6E1] dark:border-[#2E2B22] text-[#1A1814] dark:text-white hover:bg-[#FAFAF8] dark:hover:bg-[#111009] rounded-lg px-8 py-3.5 font-semibold text-sm transition-colors duration-150 min-h-[44px] flex items-center justify-center"
            >
              طقم العينات — {egp(290)}
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
            className="text-xs sm:text-sm font-semibold text-[#C9A84C] hover:underline transition-colors flex items-center gap-1"
          >
            <span>عرض الكل</span>
            <span>←</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
              مجموعة عينات متناغمة تتيح لك اختيار التوليفة العطرية الأنسب لذوقك الخاص بكل ثقة.
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

      {/* ══════════════ 6. تفاصيل الشحن والدفع (Concise Accordion) ══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#1A1814] dark:text-white">
            تفاصيل الشحن والتوصيل
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6760] dark:text-[#A09C94]">
            تكاليف الشحن وتوقيتات التوصيل لكل محافظة.
          </p>
        </div>

        <div className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-5 sm:p-6 space-y-4">
          {threshold > 0 ? (
            <div className="flex items-center gap-3 p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-xs sm:text-sm text-[#2D6A4F] font-semibold">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>
                شحن مجاني بالكامل لكل طلب بقيمة <span className="num font-bold">{egp(threshold)}</span> أو أكثر.
              </span>
            </div>
          ) : null}

          {/* قائمة الشحن المنظمة */}
          <div className="space-y-3 pt-2">
            {Object.entries(groupedRates).map(([groupName, groupItems]) => (
              <details key={groupName} className="group border border-[#E8E6E1] dark:border-[#2E2B22] rounded-lg">
                <summary className="cursor-pointer px-4 py-3 text-xs sm:text-sm font-semibold text-[#1A1814] dark:text-white flex justify-between items-center select-none">
                  <span>{groupName}</span>
                  <svg className="w-4 h-4 transition-transform duration-150 group-open:rotate-180 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-4 pb-3 pt-1 border-t border-[#E8E6E1] dark:border-[#2E2B22] space-y-2">
                  {groupItems.map((r) => (
                    <div key={r.governorate} className="flex justify-between items-center text-xs py-1.5 border-b border-[#E8E6E1]/50 dark:border-[#2E2B22]/50 last:border-0">
                      <span className="font-semibold text-[#1A1814] dark:text-white">{r.governorate}</span>
                      <div className="flex items-center gap-4 text-[#6B6760]">
                        <span className="num font-semibold text-[#1A1814] dark:text-white">{egp(r.fee)}</span>
                        <span className="num">{r.days_min}–{r.days_max} أيام عمل</span>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
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
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338-11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.146 4.185 4.189-1.098z" />
        </svg>
      </a>
    </div>
  );
}
