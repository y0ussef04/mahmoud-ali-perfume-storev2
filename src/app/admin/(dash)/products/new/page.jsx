import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-guard';
import ProductForm from '@/components/admin/ProductForm';
import { PageHead } from '@/components/admin/ui';
import { getBrands } from '@/lib/queries';
import AnimateIn from '@/components/AnimateIn';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'عطر جديد' };

export default async function NewProductPage() {
  await requireAdmin();
  const brands = await getBrands();

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
        title="عطر جديد"
        hint="سجّل البيانات الأساسية أولاً، وبعد الحفظ يمكنك إضافة الأحجام وصور العطر"
      />

      <ProductForm product={null} brands={brands || []} />
    </AnimateIn>
  );
}
