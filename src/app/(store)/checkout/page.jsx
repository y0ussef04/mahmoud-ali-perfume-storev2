import Checkout from '@/components/Checkout';
import { getSettings, getShippingRates } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'إتمام الطلب',
  description:
    'إتمام طلبك: الدفع عند الاستلام نقداً، أو بالبطاقات البنكية، أو عبر إنستاباي والمحافظ الإلكترونية.',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [rates, settings] = await Promise.all([getShippingRates(), getSettings()]);

  return (
    <div className="mx-auto max-w-wrap px-5 py-10 sm:px-8 sm:py-14">
      <nav className="mb-8 text-xs2 tracking-wide2 text-ink-42">
        العربة <span className="mx-2 text-brass">›</span> إتمام الطلب
      </nav>

      <Checkout rates={rates} settings={settings} />
    </div>
  );
}
