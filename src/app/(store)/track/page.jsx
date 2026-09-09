import TrackOrder from '@/components/TrackOrder';

export const metadata = {
  title: 'تتبع أوردر',
  description:
    'اعرف أوردرك وصل فين برقم الأوردر ورقم موبايلك — من غير تسجيل ولا باسورد.',
};

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-wrap px-5 py-12 sm:px-8 sm:py-16">
      <TrackOrder />
    </div>
  );
}
