import { Suspense } from 'react';
import { requirePermission } from '@/lib/admin-guard';
import CouponsManager from '@/components/admin/CouponsManager';
import { PageHead } from '@/components/admin/ui';
import AnimateIn from '@/components/AnimateIn';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'أكواد الخصم' };

function CouponsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#1A1814] p-6 space-y-4">
        <div className="h-5 w-40 bg-black/10 dark:bg-white/10 rounded mb-4" />
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-12 w-full bg-black/5 dark:bg-white/5 rounded-xl border border-[#E8E6E1]/50 dark:border-[#2E2B22]/50 flex items-center justify-between px-4"
          />
        ))}
      </div>
    </div>
  );
}

async function CouponsData() {
  const { supabase } = await requirePermission('coupons.view');

  const { data: coupons, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-700 dark:text-rose-400">
        {error.message}
      </div>
    );
  }

  return <CouponsManager initial={coupons || []} />;
}

export default function CouponsPage() {
  return (
    <AnimateIn>
      <PageHead
        title="أكواد الخصم"
        hint="أكواد العروض والتخفيضات مع التحقق الفوري في السيرفر عند إتمام الطلب"
      />

      <Suspense fallback={<CouponsSkeleton />}>
        <CouponsData />
      </Suspense>
    </AnimateIn>
  );
}
