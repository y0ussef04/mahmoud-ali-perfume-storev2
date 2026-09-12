import { Suspense } from 'react';
import { requirePermission } from '@/lib/admin-guard';
import ShippingManager from '@/components/admin/ShippingManager';
import { PageHead } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'الشحن والإعدادات' };

function ShippingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="surface p-6 space-y-4">
        <div className="h-5 w-40 bg-hair/50 rounded" />
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="h-12 bg-hair/20 rounded border border-hair/30" />
          <div className="h-12 bg-hair/20 rounded border border-hair/30" />
        </div>
      </div>
      <div className="surface p-6 space-y-3">
        <div className="h-5 w-48 bg-hair/50 rounded mb-4" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-12 w-full bg-hair/20 rounded border border-hair/30"
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
      <p className="border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet">
        {error.message}
      </p>
    );
  }

  return <ShippingManager rates={rates || []} settings={settings} />;
}

export default function ShippingPage() {
  return (
    <>
      <PageHead
        title="الشحن والإعدادات"
        hint="أسعار المحافظات، الشريط الإعلاني المتحرك، وأرقام التحويل"
      />

      <Suspense fallback={<ShippingSkeleton />}>
        <ShippingData />
      </Suspense>
    </>
  );
}
