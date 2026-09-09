import { requireAdmin } from '@/lib/admin-guard';
import CouponsManager from '@/components/admin/CouponsManager';
import { PageHead } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'أكواد الخصم' };

export default async function CouponsPage() {
  const { supabase } = await requireAdmin();

  const { data: coupons, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <>
      <PageHead
        title="أكواد الخصم"
        hint="العميل بيكتب الكود في صفحة إتمام الأوردر، والسيرفر بيتحقق منه"
      />

      {error ? (
        <p className="border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet">
          {error.message}
        </p>
      ) : (
        <CouponsManager initial={coupons || []} />
      )}
    </>
  );
}
