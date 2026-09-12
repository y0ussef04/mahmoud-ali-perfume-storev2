import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-guard';
import ProductForm from '@/components/admin/ProductForm';
import { PageHead } from '@/components/admin/ui';
import { dateAr } from '@/lib/money';

import { cache } from 'react';
import { getBrands } from '@/lib/queries';

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
    <>
      <PageHead
        title={product.name_ar}
        hint={`اتسجّل ${dateAr(product.created_at)} · ${
          product.is_active ? 'معروض في المتجر' : 'مخفي عن المتجر'
        }`}
      >
        <Link
          href={`/products/${product.slug}`}
          target="_blank"
          prefetch={false}
          className="btn-ghost"
        >
          شوفه في المتجر
        </Link>
      </PageHead>

      <ProductForm product={product} brands={brands || []} />
    </>
  );
}
