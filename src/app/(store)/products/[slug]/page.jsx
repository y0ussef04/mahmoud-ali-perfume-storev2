import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCart from '@/components/AddToCart';
import Gallery from '@/components/Gallery';
import ProductCard from '@/components/ProductCard';
import Spine, { NoteLadder, Strength } from '@/components/Spine';
import OlfactoryPyramid from '@/components/OlfactoryPyramid';
import { getProduct, getProducts, getRelated, getSettings } from '@/lib/queries';
import { egp } from '@/lib/money';
import { settingNum } from '@/lib/totals';
import { COUNTRY, FAMILY, GENDER } from '@/lib/labels';

export const revalidate = 60;

/** توليد مسبق لصفحات العطور — أسرع تحميل وأفضل للسيو */
export async function generateStaticParams() {
  try {
    const products = await getProducts();
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: 'العطر مش موجود' };

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

  const related = await getRelated(p, 3);
  const threshold = settingNum(settings.free_ship_threshold, 1500);

  return (
    <div className="mx-auto max-w-wrap px-4 py-10">
      {/* المسار */}
      <nav aria-label="المسار" className="text-xs2 text-ink-42">
        <Link href="/" className="hover:text-brass">الرئيسية</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <Link href="/products" className="hover:text-brass">كل العطور</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-ink-60">{p.name_ar}</span>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1.05fr_1fr]">
        {/* ══════════ العمود الأول: الهوية ══════════ */}
        <div className="relative ps-7">
          <Spine product={p} className="!w-1.5" />

          <p className="flex flex-wrap items-center gap-2 text-xs2 tracking-wide2 text-brass">
            <span>{p.brand?.name_ar}</span>
            <span aria-hidden="true">·</span>
            <span>{COUNTRY[p.brand?.country]}</span>
          </p>

          <h1 className="mt-2 text-d4 leading-tight">{p.name_ar}</h1>
          {p.name_en ? (
            <p className="mt-1 font-mark text-d1 tracking-wide2 text-ink-42">
              {p.name_en}
            </p>
          ) : null}

          <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs1 text-ink-60">
            {[p.kind || FAMILY[p.family], GENDER[p.gender], p.concentration]
              .filter(Boolean)
              .map((t, i, arr) => (
                <span key={t}>
                  {t}
                  {i < arr.length - 1 ? <span className="ms-3 text-ink-42">·</span> : null}
                </span>
              ))}
          </p>

          {p.description ? (
            <p className="mt-6 leading-relaxed text-oud">{p.description}</p>
          ) : null}

          {/* الثبات والفوحان */}
          {p.longevity || p.projection ? (
            <div className="mt-7 space-y-2.5 border-t border-hair-soft pt-5">
              <Strength value={p.longevity} label="الثبات" />
              <Strength value={p.projection} label="الفوحان" />
            </div>
          ) : null}

          {/* الهرم العطري وسلّم النوتات */}
          {p.notes_base?.length || p.notes_top?.length ? (
            <section className="mt-8">
              <h2 className="font-display text-d2">تركيبة العطر والنوتات</h2>
              <OlfactoryPyramid top={p.notes_top} heart={p.notes_heart} base={p.notes_base} />
              <div className="mt-3">
                <NoteLadder product={p} />
              </div>
            </section>
          ) : null}
        </div>

        {/* ══════════ العمود التاني: الشراء ══════════ */}
        <div>
          <div className="sticky top-24 space-y-4">
            <Gallery product={p} />

            <div className="surface p-6">
              {p.minPrice != null ? (
                <p className="num font-display text-d3">
                  {p.minPrice === p.maxPrice
                    ? egp(p.minPrice)
                    : `من ${egp(p.minPrice)} لـ ${egp(p.maxPrice)}`}
                </p>
              ) : null}

              <div className="rule my-5" />

              <AddToCart product={p} />

              <ul className="mt-7 space-y-2.5 border-t border-hair-soft pt-5 text-xs2 text-ink-60">
                <li className="flex gap-2.5">
                  <span className="mt-1.5 h-1 w-3 shrink-0 bg-brass" aria-hidden="true" />
                  أصلي ١٠٠٪ — من موزّع معتمد، والاستبدال في ٧ أيام لو مقفول.
                </li>
                {threshold > 0 ? (
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 h-1 w-3 shrink-0 bg-brass" aria-hidden="true" />
                    <span>
                      شحن مجاني من <span className="num text-oud">{egp(threshold)}</span>.
                    </span>
                  </li>
                ) : null}
                <li className="flex gap-2.5">
                  <span className="mt-1.5 h-1 w-3 shrink-0 bg-brass" aria-hidden="true" />
                  دفع عند الاستلام أو بالكارت أو بتحويل.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ عطور شبيهة ══════════ */}
      {related.length ? (
        <section className="mt-20">
          <h2 className="text-d3">لو عجبك ده</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {related.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
