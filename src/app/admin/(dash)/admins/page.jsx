import { Suspense } from 'react';
import { requirePermission, hasPermission } from '@/lib/admin-guard';
import { listAdmins, listAuditLogs } from '@/lib/actions/admin-accounts';
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
  const { admin, user } = await requirePermission('admins.view');

  const [resAdmins, resLogs] = await Promise.all([
    listAdmins(),
    admin.role === 'manager' || hasPermission(admin, 'audit_logs.view')
      ? listAuditLogs({ page: 1, limit: 15 })
      : Promise.resolve({ ok: true, logs: [], count: 0 }),
  ]);

  const admins = resAdmins.ok ? resAdmins.admins : [];
  const logs = resLogs.ok ? resLogs.logs : [];

  return (
    <AdminAccountsManager
      initialAdmins={admins}
      initialLogs={logs}
      currentAdmin={admin}
      currentUserId={user.id}
      isManager={admin.role === 'manager'}
    />
  );
}

export default function AdminsPage() {
  return (
    <>
      <PageHead
        title="حسابات مديري المتجر"
        hint="الرتب، الصلاحيات الدقيقة، سجل العمليات الحساسة، وتأمين الحسابات"
      />

      <Suspense fallback={<AdminsSkeleton />}>
        <AdminsData />
      </Suspense>
    </>
  );
}
