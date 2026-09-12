import { requireAdmin } from '@/lib/admin-guard';
import ProductForm from '@/components/admin/ProductForm';
import { PageHead } from '@/components/admin/ui';

import { getBrands } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'عطر جديد' };

export default async function NewProductPage() {
  await requireAdmin();
  const brands = await getBrands();

  return (
    <>
      <PageHead
        title="عطر جديد"
        hint="سجّل البيانات الأساسية الأول، وبعد كده هتضيف الأحجام والصور"
      />

      <ProductForm product={null} brands={brands || []} />
    </>
  );
}
