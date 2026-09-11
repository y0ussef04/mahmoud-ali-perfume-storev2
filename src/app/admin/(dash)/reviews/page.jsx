import { Suspense } from 'react';
import { requireAdmin } from '@/lib/admin-guard';
import ReviewsManager from '@/components/admin/ReviewsManager';
import { PageHead } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'إدارة آراء العملاء' };

function ReviewsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="surface p-6 space-y-4">
        <div className="h-5 w-40 bg-hair/50 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-hair/20 rounded-lg border border-hair/30" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function ReviewsData() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'customer_reviews')
    .maybeSingle();

  const reviews = data?.value || [];
  return <ReviewsManager initialReviews={reviews} />;
}

export default function AdminReviewsPage() {
  return (
    <>
      <PageHead
        title="آراء واسكرينات العملاء"
        hint="رفع وإدارة صور الشات وتجارب المشتريين المباشرة"
      />

      <Suspense fallback={<ReviewsSkeleton />}>
        <ReviewsData />
      </Suspense>
    </>
  );
}
