import { requireAdmin } from '@/lib/admin-guard';
import ProductForm from '@/components/admin/ProductForm';
import { PageHead } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'عطر جديد' };

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();

  const { data: brands } = await supabase
    .from('brands')
    .select('id, name_ar, country')
    .eq('is_active', true)
    .order('sort');

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
