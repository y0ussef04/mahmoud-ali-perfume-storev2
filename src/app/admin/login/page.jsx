import { Suspense } from 'react';
import AdminLogin from '@/components/AdminLogin';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'دخول الإدارة',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-lacquer">
          <p className="text-xs2 tracking-wide2 text-brass">لحظة…</p>
        </div>
      }
    >
      <AdminLogin />
    </Suspense>
  );
}
