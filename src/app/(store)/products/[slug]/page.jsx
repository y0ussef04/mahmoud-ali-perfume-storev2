/*
 * DESIGN DECISIONS:
 * Layout: Redesigned product details page with clean IBM Plex Sans Arabic typography and design tokens.
 * Mobile: Full 44px touch targets on variant selection & add to cart.
 * Removed: Emoji icons, non-standard text colors, heavy decorative lines.
 * RTL notes: RTL path breadcrumb, price formatted as X ج.م.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCart from '@/components/AddToCart';
import Gallery from '@/components/Gallery';
import ProductCard from '@/components/ProductCard';
import { ScentNotesBar, NoteLadder, Strength } from '@/components/Spine';
import OlfactoryPyramid from '@/components/OlfactoryPyramid';
import { getProduct, getProductSlugs, getRelated, getSettings } from '@/lib/queries';
import { egp } from '@/lib/money';
import { settingNum } from '@/lib/totals';
import { COUNTRY, FAMILY, GENDER } from '@/lib/labels';

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const slugs = await getProductSlugs();
    return slugs.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: 'العطر غير متاح' };

  const price = p.minPrice ? ` — من ${p.minPrice} ج.م` : '';
  return {
    title: `${p.name_ar} — ${p.brand?.name_ar}`,
    description:
      (p.description || `${p.name_ar} من ${p.brand?.name_ar}، أصلي ١٠٠٪.`) + price,
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;

  const [p, settings] = await Promise.all([getProduct(slug), getSettings()]);
  if (!p) notFound();

  const related = await getRelated(p, 4);
  const threshold = settingNum(settings.free_ship_threshold, 1500);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 pb-24 md:pb-12">
      {/* المسار */}
      <nav aria-label="المسار" className="flex items-center gap-2 text-xs text-[#6B6760] dark:text-[#A09C94]">
        <Link href="/" className="hover:text-[#1A1814] dark:hover:text-white transition-colors">الرئيسية</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-[#1A1814] dark:hover:text-white transition-colors">الكاتالوج</Link>
        <span>/</span>
        <span className="text-[#1A1814] dark:text-white font-semibold">{p.name_ar}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        {/* ══════════ العمود الأول: الهوية والنوتات ══════════ */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-200/50">
                {p.brand?.name_ar}
              </span>
              <span className="text-xs text-[#6B6760]">{COUNTRY[p.brand?.country]}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1A1814] dark:text-white leading-tight">
              {p.name_ar}
            </h1>

            {p.name_en ? (
              <p className="text-sm text-[#6B6760] dark:text-[#A09C94]">{p.name_en}</p>
            ) : null}

            <p className="text-xs text-[#6B6760] dark:text-[#A09C94] pt-1">
              {[p.kind || FAMILY[p.family], GENDER[p.gender], p.concentration]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>

          {/* الشريط اللوني للنوتات */}
          <div className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-4 space-y-2">
            <ScentNotesBar product={p} />
          </div>

          {p.description ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[#1A1814] dark:text-white">عن العطر:</h3>
              <p className="text-sm leading-relaxed text-[#6B6760] dark:text-[#A09C94]">{p.description}</p>
            </div>
          ) : null}

          {/* الثبات والفوحان */}
          {p.longevity || p.projection ? (
            <div className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-[#1A1814] dark:text-white mb-2">الأداء والثبات:</h3>
              <Strength value={p.longevity} label="الثبات" />
              <Strength value={p.projection} label="الفوحان" />
            </div>
          ) : null}

          {/* الهرم العطري وسلّم النوتات */}
          {p.notes_base?.length || p.notes_top?.length ? (
            <section className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-5 space-y-4">
              <h2 className="text-base font-semibold text-[#1A1814] dark:text-white">تركيبة الهرم العطري</h2>
              <OlfactoryPyramid top={p.notes_top} heart={p.notes_heart} base={p.notes_base} />
              <NoteLadder product={p} />
            </section>
          ) : null}
        </div>

        {/* ══════════ العمود الثاني: معرض الصور والشراء ══════════ */}
        <div className="lg:sticky lg:top-20 space-y-6">
          <Gallery product={p} />

          <div className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-6 space-y-6">
            {p.minPrice != null ? (
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-[#6B6760]">السعر المباشر:</span>
                <span className="text-2xl font-semibold text-[#1A1814] dark:text-white num">
                  {p.minPrice === p.maxPrice
                    ? egp(p.minPrice)
                    : `من ${egp(p.minPrice)} لـ ${egp(p.maxPrice)}`}
                </span>
              </div>
            ) : null}

            <AddToCart product={p} />

            <ul className="space-y-3 pt-4 border-t border-[#E8E6E1] dark:border-[#2E2B22] text-xs text-[#6B6760] dark:text-[#A09C94]">
              <li className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-[#2D6A4F] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>عطور أصلية ١٠٠٪ من موزعين معتمدين بالخليج.</span>
              </li>
              {threshold > 0 ? (
                <li className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-[#2D6A4F] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    شحن مجاني عند الطلب بقيمة <span className="num font-semibold text-[#1A1814] dark:text-white">{egp(threshold)}</span> فأكثر.
                  </span>
                </li>
              ) : null}
              <li className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-[#2D6A4F] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>الدفع عند الاستلام نقداً، أو إلكترونياً بالبطاقات والمحافظ وإنستاباي.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ══════════ عطور شبيهة ══════════ */}
      {related.length ? (
        <section className="pt-12 border-t border-[#E8E6E1] dark:border-[#2E2B22] space-y-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#1A1814] dark:text-white">عطور مشابهة قد تعجبك</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
