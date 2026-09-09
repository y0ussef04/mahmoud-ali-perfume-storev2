import AdminShell from '@/components/AdminShell';
import { requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: { template: '%s · لوحة التحكم', default: 'لوحة التحكم' },
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }) {
  const { supabase, admin } = await requireAdmin();

  // عدّاد "محتاج انتباه": أوردر جديد أو تحويل مستنّي مراجعة
  const { count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .or('status.eq.new,payment_status.eq.pending_review');

  return (
    <AdminShell admin={admin} pending={count || 0}>
      {children}
    </AdminShell>
  );
}
