import { requireAdmin } from '@/lib/admin-guard';
import ShippingManager from '@/components/admin/ShippingManager';
import { PageHead } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'الشحن والإعدادات' };

export default async function ShippingPage() {
  const { supabase } = await requireAdmin();

  const [{ data: rates, error }, { data: rows }] = await Promise.all([
    supabase.from('shipping_rates').select('*').order('fee').order('governorate'),
    supabase.from('settings').select('key, value'),
  ]);

  // jsonb → كائن مسطّح { key: value }
  const settings = Object.fromEntries((rows || []).map((r) => [r.key, r.value]));

  return (
    <>
      <PageHead
        title="الشحن والإعدادات"
        hint="أسعار المحافظات ورسم التحصيل وأرقام التحويل"
      />

      {error ? (
        <p className="border border-garnet bg-garnet/8 px-4 py-3 text-xs1 text-garnet">
          {error.message}
        </p>
      ) : (
        <ShippingManager rates={rates || []} settings={settings} />
      )}
    </>
  );
}
