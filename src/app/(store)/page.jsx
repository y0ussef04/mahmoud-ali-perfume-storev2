import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { Mark } from '@/components/Logo';
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

  const featured = products.filter((p) => p.is_featured).slice(0, 6);
  const list = featured.length ? featured : products.slice(0, 6);

  const threshold = settingNum(settings.free_ship_threshold, 1500);
  const codFee = settingNum(settings.cod_fee, 15);
  const cheapestShip = rates.length ? Math.min(...rates.map((r) => Number(r.fee))) : null;

  const brandsCount = new Set(products.map((p) => p.brand?.slug)).size;

  return (
    <>
      {/* ══════════════ الواجهة — البراند أولاً ══════════════ */}
      <section className="relative overflow-hidden bg-lacquer">
        <span
          aria-hidden="true"
          className="animate-mist pointer-events-none absolute left-1/2 top-0 h-[26rem] w-[26rem]
                     -translate-x-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(228,196,140,.30) 0%, rgba(169,131,78,.12) 42%, transparent 70%)',
          }}
        />

        <div className="relative mx-auto max-w-wrap px-4 py-20 text-center sm:py-28">
          <Mark size={96} className="mx-auto" />

          <p className="mt-8 font-mark text-xs1 tracking-wide3 text-brass-gilt">
            MAHMOUD-ALI&apos;S STORE
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-d4 text-brass-gilt sm:text-d5">
            محمود علي
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-brass/70">
            عطور إماراتية وسعودية أصلية — كل حجم بسعره ظاهر، تطلب في دقيقة من غير
            ما تسأل في رسالة.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              className="btn-solid border-brass-gilt bg-brass-gilt text-lacquer hover:bg-brass"
            >
              اتفرّج على الكاتالوج
            </Link>
            <Link
              href="/products?family=set"
              className="btn border-brass/50 text-brass-gilt hover:bg-brass/15"
            >
              ابدأ بطقم عيّنات بـ {egp(290)}
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════ لمحة سريعة ══════════════ */}
      <section className="border-b border-hair-soft bg-glass">
        <dl className="mx-auto grid max-w-wrap grid-cols-3 gap-px bg-hair-soft px-4 sm:px-0">
          {[
            [num(products.length), 'عطر في الكاتالوج'],
            [num(brandsCount), 'بيت عطور خليجي'],
            [num(rates.length), 'محافظة بنشحن لها'],
          ].map(([n, label]) => (
            <div key={label} className="bg-glass px-3 py-6 text-center">
              <dt className="num font-display text-d3 text-oud">{n}</dt>
              <dd className="mt-1 text-xs2 text-ink-60">{label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ══════════════ إزاي بتطلب ══════════════ */}
      <section className="mx-auto max-w-wrap px-4 py-16">
        <h2 className="text-d3">الأوردر في ٣ خطوات</h2>
        <p className="mt-2 max-w-xl text-xs1 text-ink-60">
          مفيش حساب ولا تسجيل. رقم موبايلك هو اللي بنتابع بيه.
        </p>

        <ol className="mt-8 grid gap-px border border-hair-soft bg-hair-soft sm:grid-cols-3">
          {[
            ['اختار', 'كل حجم بسعره ظاهر. تضيف للعربة على طول من الكاتالوج.'],
            ['حدّد العنوان', 'المحافظة بتحدّد مصروف الشحن ومدة الوصول فوراً.'],
            ['ادفع', 'عند الاستلام، أو بالكارت، أو تحوّل وترفع صورة الإيصال.'],
          ].map(([t, d], i) => (
            <li key={t} className="bg-glass px-6 py-7">
              <span className="num font-mark text-d3 text-brass">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 font-display text-d1">{t}</h3>
              <p className="mt-2 text-xs1 text-ink-60">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ══════════════ المختار ══════════════ */}
      <section className="mx-auto max-w-wrap px-4 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-d3">الأكثر طلباً</h2>
            <p className="mt-2 text-xs1 text-ink-60">
              العطور اللي بتخلص من المخزن الأول.
            </p>
          </div>
          <Link
            href="/products"
            className="text-xs1 tracking-wide2 text-brass underline decoration-hair underline-offset-4 hover:text-oud"
          >
            شوف الكاتالوج كامل
          </Link>
        </div>

        <SpineKey className="mt-5" />

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ══════════════ الشحن والدفع ══════════════ */}
      <section className="border-y border-hair-soft bg-glass">
        <div className="mx-auto grid max-w-wrap gap-10 px-4 py-16 lg:grid-cols-2">
          <div>
            <h2 className="text-d3">الشحن</h2>
            <ul className="mt-5 space-y-3 text-xs1 text-ink-60">
              {threshold > 0 ? (
                <li className="flex gap-3">
                  <span className="mt-2 h-1 w-4 shrink-0 bg-brass" aria-hidden="true" />
                  <span>
                    الشحن مجاني على أي أوردر من{' '}
                    <span className="num text-oud">{egp(threshold)}</span> وفوق.
                  </span>
                </li>
              ) : null}
              {cheapestShip != null ? (
                <li className="flex gap-3">
                  <span className="mt-2 h-1 w-4 shrink-0 bg-brass" aria-hidden="true" />
                  <span>
                    أقل مصروف شحن <span className="num text-oud">{egp(cheapestShip)}</span> للقاهرة
                    والجيزة والقليوبية.
                  </span>
                </li>
              ) : null}
              <li className="flex gap-3">
                <span className="mt-2 h-1 w-4 shrink-0 bg-brass" aria-hidden="true" />
                <span>
                  الدفع عند الاستلام فيه رسم تحصيل{' '}
                  <span className="num text-oud">{egp(codFee)}</span> بس — بيتلغي لو دفعت مقدّم.
                </span>
              </li>
            </ul>

            <details className="group mt-6 border border-hair-soft">
              <summary className="cursor-pointer px-4 py-3 text-xs1 tracking-wide2 text-oud">
                جدول الشحن لكل المحافظات
              </summary>
              <div className="max-h-72 overflow-y-auto border-t border-hair-soft">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>المحافظة</th>
                      <th>الشحن</th>
                      <th>المدة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rates.map((r) => (
                      <tr key={r.governorate}>
                        <td>{r.governorate}</td>
                        <td className="num">{egp(r.fee)}</td>
                        <td className="num text-ink-60">
                          {r.days_min}–{r.days_max} يوم
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>

          <div>
            <h2 className="text-d3">الدفع</h2>
            <div className="mt-5 divide-y divide-hair-soft border border-hair-soft">
              {[
                [
                  'عند الاستلام',
                  `تدفع للمندوب. رسم تحصيل ${egp(codFee)}.`,
                  'الأسهل لو أول مرة تتعامل معانا',
                ],
                [
                  'كارت أو محفظة',
                  'فيزا وماستركارد ومحافظ إلكترونية.',
                  'الأوردر يتأكّد على طول',
                ],
                [
                  'إنستاباي أو فودافون كاش',
                  `تحوّل على ${settings.wallet_number} وترفع صورة الإيصال.`,
                  'بنراجع التحويل وبنأكّد في نفس اليوم',
                ],
              ].map(([t, d, note]) => (
                <div key={t} className="px-5 py-4">
                  <h3 className="font-display text-d1">{t}</h3>
                  <p className="mt-1 text-xs1 text-ink-60">{d}</p>
                  <p className="mt-1 text-xs2 text-brass">{note}</p>
                </div>
              ))}
            </div>

            <p className="mt-5 text-xs2 leading-relaxed text-ink-42">
              كل العطور أصلية من موزّعين معتمدين لبيوت{' '}
              {COUNTRY.AE} و{COUNTRY.SA}. لو لقيت أي مشكلة والعطر لسه مقفول، الاستبدال
              في ٧ أيام.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
