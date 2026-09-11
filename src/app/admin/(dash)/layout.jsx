import AdminShell from '@/components/AdminShell';
import { requireAdmin } from '@/lib/admin-guard';
import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: { template: '%s · لوحة التحكم', default: 'لوحة التحكم' },
  robots: { index: false, follow: false, nocache: true },
};

/** كاش عداد الأوردرات الجديدة في الذاكرة (0ms) ويُجدد تلقائياً عند أي تعديل على الأوردرات */
const getPendingOrdersCount = unstable_cache(
  async () => {
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { count } = await adminClient
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .or('status.eq.new,payment_status.eq.pending_review');
    return count || 0;
  },
  ['admin-pending-count'],
  { revalidate: 30, tags: ['orders'] }
);

export default async function AdminLayout({ children }) {
  const [{ admin }, pending] = await Promise.all([
    requireAdmin(),
    getPendingOrdersCount(),
  ]);

  return (
    <AdminShell admin={admin} pending={pending}>
      {children}
    </AdminShell>
  );
}
