import { Suspense } from 'react';
import { requirePermission } from '@/lib/admin-guard';
import ReviewsManager from '@/components/admin/ReviewsManager';
import { PageHead } from '@/components/admin/ui';
import AnimateIn from '@/components/AnimateIn';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'إدارة آراء العملاء' };

function ReviewsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="rounded-2xl border border-[#E8E6E1] dark:border-[#2E2B22] bg-white dark:bg-[#1A1814] p-6 space-y-4">
        <div className="h-5 w-40 bg-black/10 dark:bg-white/10 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-black/5 dark:bg-white/5 rounded-xl border border-[#E8E6E1]/50 dark:border-[#2E2B22]/50" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function ReviewsData() {
  const { supabase } = await requirePermission('products.view');

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
    <AnimateIn>
      <PageHead
        title="آراء واسكرينات العملاء"
        hint="إدارة وتحديث اسكرينات المحادثات وتجارب المشترين الحقيقية المعروضة في المتجر"
      />

      <Suspense fallback={<ReviewsSkeleton />}>
        <ReviewsData />
      </Suspense>
    </AnimateIn>
  );
}
