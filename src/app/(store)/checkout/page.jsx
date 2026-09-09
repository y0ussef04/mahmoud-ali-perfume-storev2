import Checkout from '@/components/Checkout';
import { getSettings, getShippingRates } from '@/lib/queries';

export const revalidate = 60;

export const metadata = {
  title: 'إتمام الأوردر',
  description:
    'أكمل أوردرك: دفع عند الاستلام، أو كارت ومحفظة، أو تحويل إنستاباي وفودافون كاش.',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [rates, settings] = await Promise.all([getShippingRates(), getSettings()]);

  return (
    <div className="mx-auto max-w-wrap px-5 py-10 sm:px-8 sm:py-14">
      <nav className="mb-8 text-xs2 tracking-wide2 text-ink-42">
        العربة <span className="mx-2 text-brass">›</span> إتمام الأوردر
      </nav>

      <Checkout rates={rates} settings={settings} />
    </div>
  );
}
