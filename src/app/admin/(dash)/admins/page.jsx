import { requireAdmin } from '@/lib/admin-guard';
import { listAdmins } from '@/lib/actions/admin-accounts';
import { PageHead } from '@/components/admin/ui';
import AdminAccountsManager from '@/components/admin/AdminAccountsManager';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'إدارة حسابات المديرين' };

export default async function AdminsPage() {
  const { user } = await requireAdmin();
  const res = await listAdmins();

  const admins = res.ok ? res.admins : [];

  return (
    <>
      <PageHead
        title="حسابات مديري المتجر"
        hint="إدارة المديرين، الصلاحيات، وتحديث كلمات المرور"
      />

      <AdminAccountsManager
        initialAdmins={admins}
        currentUserId={user.id}
      />
    </>
  );
}
