import { Suspense } from 'react';
import { requirePermission } from '@/lib/admin-guard';
import ShippingManager from '@/components/admin/ShippingManager';
import { PageHead } from '@/components/admin/ui';
import AnimateIn from '@/components/AnimateIn';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'الشحن والإعدادات' };

function ShippingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#1A1814] p-6 space-y-4">
        <div className="h-5 w-40 bg-black/10 dark:bg-white/10 rounded" />
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="h-12 bg-black/5 dark:bg-white/5 rounded-xl border border-[#E8E6E1]/50 dark:border-[#2E2B22]/50" />
          <div className="h-12 bg-black/5 dark:bg-white/5 rounded-xl border border-[#E8E6E1]/50 dark:border-[#2E2B22]/50" />
        </div>
      </div>
      <div className="rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#1A1814] p-6 space-y-3">
        <div className="h-5 w-48 bg-black/10 dark:bg-white/10 rounded mb-4" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-12 w-full bg-black/5 dark:bg-white/5 rounded-xl border border-[#E8E6E1]/50 dark:border-[#2E2B22]/50"
          />
        ))}
      </div>
    </div>
  );
}

async function ShippingData() {
  const { supabase } = await requirePermission('shipping.view');

  const [{ data: rates, error }, { data: rows }] = await Promise.all([
    supabase.from('shipping_rates').select('*').order('fee').order('governorate'),
    supabase.from('settings').select('key, value'),
  ]);

  const settings = Object.fromEntries((rows || []).map((r) => [r.key, r.value]));

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-700 dark:text-rose-400">
        {error.message}
      </div>
    );
  }

  return <ShippingManager rates={rates || []} settings={settings} />;
}

export default function ShippingPage() {
  return (
    <AnimateIn>
      <PageHead
        title="الشحن والإعدادات"
        hint="أسعار توصيل المحافظات، الشريط الإعلاني المتحرك، وأرقام التحويل"
      />

      <Suspense fallback={<ShippingSkeleton />}>
        <ShippingData />
      </Suspense>
    </AnimateIn>
  );
}
