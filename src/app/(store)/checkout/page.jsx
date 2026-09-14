import Checkout from '@/components/Checkout';
import { getSettings, getShippingRates } from '@/lib/queries';
import Link from 'next/link';
import { ChevronLeft, Lock } from 'lucide-react';

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
    <div className="relative min-h-screen pb-16 pt-6 sm:pt-10">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#C9A84C]/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-10 w-[400px] h-[400px] bg-[#8B6914]/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb & Secure Badge */}
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-[#E8E6E1]/60 dark:border-[#2E2B22]/60 pb-4">
          <nav className="flex items-center gap-2 text-xs font-medium text-[#736B5E] dark:text-[#A8A296]">
            <Link href="/" className="hover:text-[#C9A84C] transition-colors">
              الرئيسية
            </Link>
            <ChevronLeft className="w-3 h-3 text-[#C9A84C]" />
            <Link href="/products" className="hover:text-[#C9A84C] transition-colors">
              المتجر
            </Link>
            <ChevronLeft className="w-3 h-3 text-[#C9A84C]" />
            <span className="text-[#1A1814] dark:text-white font-semibold">إتمام الطلب</span>
          </nav>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#8B6914] dark:text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/25 px-3 py-1 rounded-full">
            <Lock className="w-3.5 h-3.5" />
            <span>تسوق آمن ومشفّر ١٠٠٪</span>
          </div>
        </div>

        <Checkout rates={rates} settings={settings} />
      </div>
    </div>
  );
}
