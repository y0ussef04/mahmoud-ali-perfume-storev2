import Link from 'next/link';
import { Suspense } from 'react';
import { requirePermission } from '@/lib/admin-guard';
import { PageHead, Panel } from '@/components/admin/ui';
import { getBrands } from '@/lib/queries';
import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import ProductsManager from '@/components/admin/ProductsManager';
import AnimateIn from '@/components/AnimateIn';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'العطور والمخزون' };

function ProductsTableSkeleton() {
  return (
    <Panel>
      <div className="overflow-x-auto animate-pulse">
        <div className="h-10 w-full bg-hair/40 rounded-lg mb-3" />
        <div className="space-y-3 py-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-12 w-full bg-hair/20 rounded-lg border border-hair/30 flex items-center justify-between px-4"
            >
              <div className="h-4 w-32 bg-hair/40 rounded" />
              <div className="h-4 w-20 bg-hair/30 rounded" />
              <div className="h-4 w-12 bg-hair/30 rounded" />
              <div className="h-4 w-20 bg-hair/40 rounded" />
              <div className="h-4 w-16 bg-hair/40 rounded" />
              <div className="h-5 w-16 bg-hair/30 rounded-full" />
              <div className="h-4 w-24 bg-hair/30 rounded" />
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

const getAllAdminProducts = unstable_cache(
  async () => {
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data, error } = await adminClient
      .from('products')
      .select(
        `id, slug, name_ar, name_en, family, gender, is_active, is_featured, created_at,
         brand:brands ( id, name_ar ),
         variants ( id, label, price, stock, is_active )`
      )
      .order('created_at', { ascending: false });
    return { data: data || [], error: error?.message || null };
  },
  ['admin-products-full'],
  { revalidate: 60, tags: ['products'] }
);

async function ProductsContent() {
  await requirePermission('products.view');

  const [brands, { data: products }] = await Promise.all([
    getBrands(),
    getAllAdminProducts(),
  ]);

  return <ProductsManager initialProducts={products || []} brands={brands || []} />;
}

export default function AdminProductsPage() {
  return (
    <AnimateIn>
      <PageHead
        title="العطور والمخزون"
        hint="الأسعار والكميات وحالات العرض في المتجر"
      >
        <Link
          href="/admin/products/new"
          className="group/btn relative overflow-hidden bg-gradient-to-r from-[#1A1814] to-[#2D2921] dark:from-[#C9A84C] dark:to-[#8B6914] text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-all duration-300 active:scale-[0.97] flex items-center gap-1.5 shadow-sm hover:shadow-md hover:shadow-[#C9A84C]/20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
          <Plus className="w-4 h-4 relative" />
          <span className="relative">إضافة عطر جديد</span>
        </Link>
      </PageHead>

      <Suspense fallback={<ProductsTableSkeleton />}>
        <ProductsContent />
      </Suspense>
    </AnimateIn>
  );
}
