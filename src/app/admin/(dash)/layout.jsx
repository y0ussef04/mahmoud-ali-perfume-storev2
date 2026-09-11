import AdminShell from '@/components/AdminShell';
import { requireAdmin } from '@/lib/admin-guard';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: { template: '%s · لوحة التحكم', default: 'لوحة التحكم' },
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }) {
  // تنفيذ التحقق من الأدمن وعدّاد الأوردرات الجديدة بالتوازي لتقليل وقت الاستجابة
  const [{ admin }, { count }] = await Promise.all([
    requireAdmin(),
    createClient().then((sb) =>
      sb
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .or('status.eq.new,payment_status.eq.pending_review')
    ),
  ]);

  return (
    <AdminShell admin={admin} pending={count || 0}>
      {children}
    </AdminShell>
  );
}
