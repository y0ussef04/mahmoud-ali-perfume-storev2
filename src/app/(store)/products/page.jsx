import Catalog from '@/components/Catalog';
import { getBrands, getProducts } from '@/lib/queries';

export const metadata = {
  title: 'كل العطور',
  description:
    'كاتالوج عطور إماراتية وسعودية أصلية — كل حجم بسعره، مع النوتات والثبات وحالة التوفّر.',
};

export const revalidate = 60;

export default async function ProductsPage({ searchParams }) {
  // في Next 15 الـ searchParams بقى Promise
  const sp = await searchParams;
  const [products, brands] = await Promise.all([getProducts(), getBrands()]);

  return (
    <div className="mx-auto max-w-wrap px-4 py-12">
      <header className="max-w-2xl">
        <p className="text-xs2 tracking-wide3 text-brass">الكتالوج</p>
        <h1 className="mt-2 text-d4">مجموعة العطور الفاخرة</h1>
        <p className="mt-3 text-ink-60 leading-relaxed text-sm">
          تشكيلة العطور الخليجية الأصلية معروضة بتفاصيلها وأسعارها وأحجامها المباشرة لضمان تجربة تسوق واضحة وموثوقة.
        </p>
      </header>

      <div className="rule my-9" />

      <Catalog
        products={products}
        brands={brands}
        initialFamily={typeof sp?.family === 'string' ? sp.family : ''}
      />
    </div>
  );
}
