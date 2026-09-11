import { Suspense } from 'react';
import { requireAdmin } from '@/lib/admin-guard';
import CouponsManager from '@/components/admin/CouponsManager';
import { PageHead } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'أكواد الخصم' };

function CouponsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="surface p-6 space-y-4">
        <div className="h-5 w-40 bg-hair/50 rounded mb-4" />
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-12 w-full bg-hair/20 rounded border border-hair/30 flex items-center justify-between px-4"
          />
        ))}
      </div>
    </div>
  );
}

async function CouponsData() {
  const { supabase } = await requireAdmin();

  const { data: coupons, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <p className="border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet">
        {error.message}
      </p>
    );
  }

  return <CouponsManager initial={coupons || []} />;
}

export default function CouponsPage() {
  return (
    <>
      <PageHead
        title="أكواد الخصم"
        hint="العميل بيكتب الكود في صفحة إتمام الأوردر، والسيرفر بيتحقق منه"
      />

      <Suspense fallback={<CouponsSkeleton />}>
        <CouponsData />
      </Suspense>
    </>
  );
}
