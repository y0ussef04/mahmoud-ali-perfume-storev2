import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import ReviewsSection from '@/components/ReviewsSection';
import AnimateIn from '@/components/AnimateIn';
import { getProducts, getSettings } from '@/lib/queries';
import { egp } from '@/lib/money';
import { ShieldCheck, Truck, Banknote, Sparkles, ArrowLeft } from 'lucide-react';

export const revalidate = 60;

export default async function HomePage() {
  const [products, settings] = await Promise.all([
    getProducts(),
    getSettings(),
  ]);

  const featured = products.filter((p) => p.is_featured).slice(0, 8);
  const list = featured.length ? featured : products.slice(0, 8);

  return (
    <div className="pb-16 md:pb-8 overflow-x-hidden w-full max-w-full">
      
      {/* ══════════════ 1. الهيرو الفاخر مع خلفية عطور عربية راقية ══════════════ */}
      <section className="relative overflow-hidden border-b border-[#E8E6E1] dark:border-[#2E2B22] py-20 sm:py-32 bg-[#FAF9F5] dark:bg-[#0E0D09]">
        {/* Luxury Background Image Artwork */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <Image
            src="/hero-perfume-bg.jpg"
            alt="أجواء عطور محمود علي الفاخرة"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-30 dark:opacity-45 mix-blend-multiply dark:mix-blend-screen scale-105"
          />
          {/* Subtle gradient vignette to blend top/bottom seamlessly and ensure pristine text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF9F5]/80 via-[#FAF9F5]/40 to-[#FAF9F5] dark:from-[#0E0D09]/85 dark:via-[#0E0D09]/50 dark:to-[#0E0D09]" />
        </div>

        {/* Ambient Glowing Orbs */}
        <div className="absolute top-1/4 right-1/4 w-[450px] h-[450px] bg-[#C9A84C]/10 dark:bg-[#C9A84C]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-[#8B6914]/10 dark:bg-[#8B6914]/20 rounded-full blur-[100px] pointer-events-none" />

        <AnimateIn direction="up" delay={0.1} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center justify-center bg-[#C9A84C]/15 dark:bg-[#C9A84C]/10 border border-[#C9A84C]/30 px-4 py-1.5 rounded-full text-xs font-semibold text-[#8B6914] dark:text-[#E8D9B3] backdrop-blur-sm shadow-sm">
            <span>عطور خليجية فاخرة وأصلية ١٠٠٪</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-semibold text-[#1A1814] dark:text-white leading-tight tracking-tight">
            محمود علي للعطور
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-[#6B6760] dark:text-[#A09C94] leading-relaxed max-w-2xl mx-auto">
            روائع العطور الإماراتية والسعودية المختارة بعناية. ثبات استثنائي وتفرد في كل رشة.
          </p>

          <AnimateIn direction="up" delay={0.3} className="flex flex-wrap items-center justify-center pt-4">
            <Link
              href="/products"
              prefetch={true}
              className="group/btn relative overflow-hidden bg-gradient-to-r from-[#1A1814] to-[#2D2921] dark:from-[#C9A84C] dark:to-[#8B6914] hover:from-[#C9A84C] hover:to-[#8B6914] dark:hover:from-[#E8D9B3] dark:hover:to-[#C9A84C] text-white rounded-full px-8 py-3.5 font-semibold text-sm transition-all duration-300 active:scale-[0.97] min-h-[44px] flex items-center justify-center shadow-lg shadow-[#1A1814]/10 dark:shadow-[#C9A84C]/20 w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              <span className="relative">استكشف المجموعة</span>
            </Link>
          </AnimateIn>
        </AnimateIn>
      </section>

      {/* ══════════════ 2. شريط الأصالة والضمان (Luxury Trust Bar) ══════════════ */}
      <section className="relative z-10 border-b border-[#E8E6E1] dark:border-[#2E2B22] bg-white/70 dark:bg-[#12110C]/80 backdrop-blur-md py-6">
        <div className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
            <AnimateIn direction="up" delay={0.05} className="w-full">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right gap-1 sm:gap-3.5 p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/85 dark:bg-[#1A1814]/85 border border-[#E8E6E1] dark:border-[#2E2B22] shadow-xs hover:border-[#C9A84C]/40 transition-all duration-300">
                <span className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/25 flex items-center justify-center text-[#C9A84C] shrink-0">
                  <ShieldCheck strokeWidth={1.75} className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </span>
                <div>
                  <p className="text-[10px] sm:text-sm font-bold text-[#1A1814] dark:text-[#F5F5F0]">أصالة ١٠٠٪</p>
                  <p className="text-[11px] text-[#8C887B] dark:text-[#A09C94] hidden sm:block mt-0.5">عطور أصلية ومفحوصة</p>
                </div>
              </div>
            </AnimateIn>

            <AnimateIn direction="up" delay={0.1} className="w-full">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right gap-1 sm:gap-3.5 p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/85 dark:bg-[#1A1814]/85 border border-[#E8E6E1] dark:border-[#2E2B22] shadow-xs hover:border-[#C9A84C]/40 transition-all duration-300">
                <span className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/25 flex items-center justify-center text-[#C9A84C] shrink-0">
                  <Truck strokeWidth={1.75} className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </span>
                <div>
                  <p className="text-[10px] sm:text-sm font-bold text-[#1A1814] dark:text-[#F5F5F0]">شحن سريع</p>
                  <p className="text-[11px] text-[#8C887B] dark:text-[#A09C94] hidden sm:block mt-0.5">توصيل آمن لباب بيتك</p>
                </div>
              </div>
            </AnimateIn>

            <AnimateIn direction="up" delay={0.15} className="w-full">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right gap-1 sm:gap-3.5 p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/85 dark:bg-[#1A1814]/85 border border-[#E8E6E1] dark:border-[#2E2B22] shadow-xs hover:border-[#C9A84C]/40 transition-all duration-300">
                <span className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/25 flex items-center justify-center text-[#C9A84C] shrink-0">
                  <Banknote strokeWidth={1.75} className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </span>
                <div>
                  <p className="text-[10px] sm:text-sm font-bold text-[#1A1814] dark:text-[#F5F5F0]">الدفع بالاستلام</p>
                  <p className="text-[11px] text-[#8C887B] dark:text-[#A09C94] hidden sm:block mt-0.5">عاين طلبك ثم ادفع</p>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ══════════════ 3. المنتجات الأكثر طلباً (Featured Products) ══════════════ */}
      {list.length > 0 && (
        <section className="relative overflow-hidden max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-12 sm:py-24 space-y-6 sm:space-y-8">
          {/* Subtle ambient lighting behind products */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#C9A84C]/5 rounded-full blur-[140px] pointer-events-none -z-10" />

          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E8E6E1]/60 dark:border-[#2E2B22]/60 pb-4">
            <div>
              <h2 className="text-xl sm:text-3xl font-semibold text-[#1A1814] dark:text-white">
                الأكثر طلباً ورواجاً
              </h2>
            </div>
            <Link
              href="/products"
              prefetch={true}
              className="text-xs sm:text-sm font-semibold text-[#C9A84C] hover:text-[#8B6914] dark:hover:text-[#E8D9B3] transition-colors flex items-center gap-1.5 group"
            >
              <span>عرض كل العطور</span>
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {list.map((p, idx) => (
              <AnimateIn key={p.id} direction="up" delay={idx * 0.05}>
                <ProductCard product={p} />
              </AnimateIn>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════ 4. طقم العينات (Discovery Set Banner) ══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <AnimateIn direction="up" className="relative overflow-hidden bg-gradient-to-l from-[#171510] via-[#231F17] to-[#171510] text-white rounded-3xl p-7 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-[#C9A84C]/35 shadow-2xl">
          {/* Ambient golden glows inside the banner */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#C9A84C]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 text-center md:text-start relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#C9A84C]/20 text-[#E8D9B3] border border-[#C9A84C]/30 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A84C]" />
              <span>تجربة استكشافية مميزة</span>
            </span>
            <h3 className="text-2xl sm:text-3xl font-semibold">طقم عينات عطور النخبة</h3>
            <p className="text-xs sm:text-sm text-[#A09C94] max-w-xl leading-relaxed">
              مجموعة عينات متناغمة تتيح لك اختيار التوليفة العطرية الأنسب لذوقك الخاص بكل ثقة قبل شراء الحجم الكامل.
            </p>
          </div>
          <div className="shrink-0 text-center md:text-end relative z-10">
            <Link
              href="/products?family=set"
              className="group/btn relative overflow-hidden bg-gradient-to-r from-[#C9A84C] to-[#8B6914] hover:from-[#E8D9B3] hover:to-[#C9A84C] text-white font-semibold text-sm px-7 py-3.5 rounded-full transition-all duration-300 inline-flex items-center gap-2 min-h-[44px] shadow-lg shadow-[#C9A84C]/20 active:scale-[0.97]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              <span className="relative">طلب طقم العينات — {egp(290)}</span>
            </Link>
          </div>
        </AnimateIn>
      </section>

      {/* ══════════════ 5. آراء وتقييمات العملاء (Customer Reviews) ══════════════ */}
      <ReviewsSection reviews={settings?.customer_reviews} />
      
    </div>
  );
}
