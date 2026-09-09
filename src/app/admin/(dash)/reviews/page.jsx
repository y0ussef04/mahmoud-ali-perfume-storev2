import { requireAdmin } from '@/lib/admin-guard';
import ReviewsManager from '@/components/admin/ReviewsManager';
import { PageHead } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'إدارة آراء العملاء' };

export default async function AdminReviewsPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'customer_reviews')
    .maybeSingle();

  const reviews = data?.value || [];

  return (
    <>
      <PageHead
        title="آراء واسكرينات العملاء"
        hint="رفع وإدارة صور الشات وتجارب المشتريين المباشرة"
      />

      <ReviewsManager initialReviews={reviews} />
    </>
  );
}
