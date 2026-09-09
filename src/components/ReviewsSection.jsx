/*
 * DESIGN DECISIONS:
 * Layout: Mobile horizontal scroll snap / Desktop 3-column grid for customer reviews.
 * Mobile: Snap layout with min-w-[280px] touch-friendly cards.
 * Removed: Emoji stars, ALL-CAPS eyebrow labels, decorative patterns.
 * RTL notes: Arabic natural alignment and SVG stars in amber.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';

const DEFAULT_REVIEWS = [
  {
    id: '1',
    customer_name: 'م. أحمد الشريف',
    city: 'القاهرة (التجمع)',
    rating: 5,
    perfume: 'خمرة — لطافة',
    comment:
      'طلبته ووصلني تاني يوم بالتغليف المظبوط. العطر أصلي ١٠٠٪ والفوحان بتاعه ما شاء الله بيثبت أكتر من ١٢ ساعة. تجربة محترمة جداً.',
    date: 'منذ ٣ أيام',
    image_url: '',
  },
  {
    id: '2',
    customer_name: 'د. سارة عبد الفتاح',
    city: 'الإسكندرية',
    rating: 5,
    perfume: 'طقم عيّنات الخليج',
    comment:
      'طقم العيّنات فكرة ممتازة جداً قبل ما تشتري الحجم الكبير! عرفت اختار العطر اللي يناسب ذوقي بدون مغامرة. شكراً محمود علي على المصداقية.',
    date: 'منذ أسبوع',
    image_url: '',
  },
  {
    id: '3',
    customer_name: 'عمر الهاشمي',
    city: 'الجيزة (الشيخ زايد)',
    rating: 5,
    perfume: 'أسد — لطافة',
    comment:
      'أول مرة أتعامل مع متجر بيحط كل الأسعار والأحجام واضحة كده من غير ما تضطر تبعت في الرسائل وتاخد رد متأخر. السعر ممتاز والتوصيل سريع.',
    date: 'منذ أسبوعين',
    image_url: '',
  },
];

function StarRating({ rating = 5 }) {
  return (
    <div className="flex items-center gap-0.5 text-[#C9A84C]">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'fill-[#C9A84C]' : 'fill-[#E8E6E1] dark:fill-[#2E2B22]'}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsSection({ reviews = [] }) {
  const list = reviews && reviews.length > 0 ? reviews : DEFAULT_REVIEWS;
  const [activeImage, setActiveImage] = useState(null);

  return (
    <section className="py-12 sm:py-16 lg:py-20 border-t border-[#E8E6E1] dark:border-[#2E2B22]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10 sm:mb-12">
          <span className="text-xs font-semibold text-[#C9A84C] tracking-widest uppercase">
            مصداقية وثقة
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#1A1814] dark:text-white">
            تجارب وآراء العملاء
          </h2>
          <p className="text-sm text-[#6B6760] dark:text-[#A09C94]">
            انطباعات وتقييمات من عملاء اختبروا ثبات العطور وأصالتها.
          </p>
        </div>

        {/* ─── Mobile Snap Scroll / Desktop Grid ─── */}
        <div className="flex md:grid md:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 md:pb-0 no-scrollbar">
          {list.map((r) => (
            <div
              key={r.id || r.customer_name}
              className="snap-start shrink-0 w-[280px] sm:w-[320px] md:w-auto bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-5 sm:p-6 flex flex-col justify-between hover:border-[#D4CFC8] transition-colors duration-150"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <StarRating rating={r.rating || 5} />
                  <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-[#2D6A4F] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                    <svg className="w-3 h-3 stroke-current" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>مشتري مؤكد</span>
                  </span>
                </div>

                {r.image_url ? (
                  <div
                    onClick={() => setActiveImage(r.image_url)}
                    className="relative h-44 w-full border border-[#E8E6E1] dark:border-[#2E2B22] rounded-lg overflow-hidden cursor-pointer group bg-[#FAFAF8] dark:bg-[#111009]"
                  >
                    <Image
                      src={r.image_url}
                      alt={`اسكرين رأي ${r.customer_name || 'العميل'}`}
                      fill
                      className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center text-xs text-white font-semibold">
                      انقر للتكبير
                    </div>
                  </div>
                ) : null}

                {r.comment ? (
                  <p className="text-sm leading-relaxed text-[#1A1814] dark:text-white/90">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                ) : null}
              </div>

              <div className="pt-4 mt-4 border-t border-[#E8E6E1] dark:border-[#2E2B22] flex items-center justify-between text-xs text-[#6B6760] dark:text-[#A09C94]">
                <div>
                  <p className="font-semibold text-[#1A1814] dark:text-white">{r.customer_name || r.name || 'عميل كرام'}</p>
                  <p>{r.city || 'مصر'}</p>
                </div>
                <div className="text-end">
                  <span className="block font-semibold text-[#C9A84C]">{r.perfume}</span>
                  <span>{r.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <div className="relative w-full h-full max-h-[80vh] overflow-hidden rounded-xl bg-black border border-[#E8E6E1]/20">
              <Image
                src={activeImage}
                alt="اسكرين مكبر"
                fill
                className="object-contain"
              />
            </div>
            <button
              type="button"
              onClick={() => setActiveImage(null)}
              className="absolute top-4 end-4 bg-white text-[#1A1814] font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-[#FAFAF8] flex items-center gap-1.5 min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>إغلاق</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
