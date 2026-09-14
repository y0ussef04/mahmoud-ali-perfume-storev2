import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-guard';
import ProductForm from '@/components/admin/ProductForm';
import { PageHead } from '@/components/admin/ui';
import { dateAr } from '@/lib/money';
import { cache } from 'react';
import { getBrands } from '@/lib/queries';
import AnimateIn from '@/components/AnimateIn';
import { ArrowRight, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getProductAdmin = cache(async (id) => {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from('products')
    .select(
      `*,
       variants ( id, label, ml, price, compare_price, stock, sku, sort, is_active ),
       images:product_images ( id, url, alt, sort )`
    )
    .eq('id', id)
    .maybeSingle();
  return data;
});

export async function generateMetadata({ params }) {
  const { id } = await params;
  if (!UUID.test(id)) return { title: 'غير موجود' };

  const product = await getProductAdmin(id);
  return { title: product?.name_ar || 'عطر' };
}

export default async function EditProductPage({ params }) {
  const { id } = await params;

  if (!UUID.test(id)) notFound();

  const [product, brands] = await Promise.all([
    getProductAdmin(id),
    getBrands(),
  ]);

  if (!product) notFound();

  return (
    <AnimateIn className="space-y-6">
      <div className="mb-2">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#736B5E] dark:text-[#A8A296] hover:text-[#C9A84C] transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>كل العطور</span>
        </Link>
      </div>

      <PageHead
        title={product.name_ar}
        hint={`تم التسجيل ${dateAr(product.created_at)} · ${
          product.is_active ? 'معروض في المتجر للزوار' : 'مخفي عن المتجر حالياً'
        }`}
      >
        <Link
          href={`/products/${product.slug}`}
          target="_blank"
          prefetch={false}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#1A1814] px-4 py-2 text-xs font-semibold text-[#1A1814] dark:text-[#F5F2EB] shadow-sm hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#C9A84C]" />
          <span>معاينة في المتجر</span>
        </Link>
      </PageHead>

      <ProductForm product={product} brands={brands || []} />
    </AnimateIn>
  );
}
