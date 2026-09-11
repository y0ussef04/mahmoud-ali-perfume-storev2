import { Suspense } from 'react';
import { requireAdmin } from '@/lib/admin-guard';
import { listAdmins } from '@/lib/actions/admin-accounts';
import { PageHead } from '@/components/admin/ui';
import AdminAccountsManager from '@/components/admin/AdminAccountsManager';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'إدارة حسابات المديرين' };

function AdminsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="surface p-6 space-y-4">
        <div className="h-5 w-40 bg-hair/50 rounded mb-4" />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-12 w-full bg-hair/20 rounded border border-hair/30 flex items-center justify-between px-4"
          />
        ))}
      </div>
    </div>
  );
}

async function AdminsData() {
  const { user } = await requireAdmin();
  const res = await listAdmins();
  const admins = res.ok ? res.admins : [];

  return (
    <AdminAccountsManager
      initialAdmins={admins}
      currentUserId={user.id}
    />
  );
}

export default function AdminsPage() {
  return (
    <>
      <PageHead
        title="حسابات مديري المتجر"
        hint="إدارة المديرين، الصلاحيات، وتحديث كلمات المرور"
      />

      <Suspense fallback={<AdminsSkeleton />}>
        <AdminsData />
      </Suspense>
    </>
  );
}
