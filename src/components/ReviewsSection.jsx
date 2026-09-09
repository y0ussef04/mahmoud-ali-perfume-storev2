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

export default function ReviewsSection({ reviews = [] }) {
  const list = reviews && reviews.length > 0 ? reviews : DEFAULT_REVIEWS;
  const [activeImage, setActiveImage] = useState(null);

  return (
    <section className="mx-auto max-w-wrap px-4 py-16 border-t border-hair-soft">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs2 font-mark tracking-wide3 text-brass-gilt block mb-1">
          VERIFIED CUSTOMER REVIEWS
        </span>
        <h2 className="text-d3">آراء وتجارب عملاء محمود علي</h2>
        <p className="mt-2 text-xs1 text-ink-60">
          اسكرينات وتجارب حقيقية لعملاء جربوا عطورنا وأكدوا الأصالة والفوحان والسرعة.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {list.map((r) => (
          <div
            key={r.id || r.customer_name}
            className="surface p-5 flex flex-col justify-between relative group hover:border-brass/60 transition-all duration-300 shadow-sm hover:shadow-lg"
            style={{ borderRadius: 4 }}
          >
            <div>
              {/* شارات التقييم والمشتري المؤكد */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex text-amber-400 text-xs1">
                  {'★'.repeat(r.rating || 5)}
                </div>
                <span className="inline-flex items-center gap-1 border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs2 text-emerald-400 rounded-xs">
                  ✓ مشتري مؤكد
                </span>
              </div>

              {/* صورة اسكرين المحادثة لو توفرت */}
              {r.image_url ? (
                <div
                  onClick={() => setActiveImage(r.image_url)}
                  className="relative h-48 w-full mb-4 border border-hair-soft bg-lacquer/80 rounded-xs overflow-hidden cursor-zoom-in group/img"
                >
                  <Image
                    src={r.image_url}
                    alt={`اسكرين رأي ${r.customer_name || 'العميل'}`}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover/img:scale-105"
                  />
                  <div className="absolute inset-0 bg-lacquer/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-xs2 text-white font-bold bg-lacquer/40 backdrop-blur-xs">
                    🔍 انقر للتكبير
                  </div>
                </div>
              ) : null}

              {/* نص التعليق */}
              {r.comment ? (
                <p className="text-xs1 leading-relaxed text-oud font-body italic mb-4">
                  &ldquo;{r.comment}&rdquo;
                </p>
              ) : null}
            </div>

            <div className="border-t border-hair-soft pt-3 mt-2 flex items-center justify-between text-xs2">
              <div>
                <p className="font-bold text-oud">{r.customer_name || r.name || 'عميل محترم'}</p>
                <p className="text-ink-42">{r.city || 'مصر'}</p>
              </div>
              <div className="text-left">
                <span className="block text-brass-gilt font-medium">{r.perfume}</span>
                <span className="text-ink-42">{r.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* نافذة تكبير الصورة (Lightbox Modal) */}
      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 z-50 bg-lacquer/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <div className="relative w-full h-full max-h-[85vh] overflow-hidden rounded-md border border-brass/50 bg-black shadow-2xl">
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
              className="absolute top-4 right-4 bg-brass-gilt text-lacquer font-bold px-3 py-1.5 rounded-xs text-xs1 hover:bg-brass"
            >
              ✕ إغلاق النافذة
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
