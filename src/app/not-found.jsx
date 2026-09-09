import Link from 'next/link';
import { Mark } from '@/components/Logo';

export const metadata = { title: 'الصفحة مش موجودة' };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Mark size={72} />
      <h1 className="text-d3">الصفحة دي مش موجودة</h1>
      <p className="max-w-sm text-xs1 text-ink-60">
        يمكن العطر اتشال من الكاتالوج، أو الرابط فيه غلطة.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/products" className="btn-solid">
          كل العطور
        </Link>
        <Link href="/" className="btn-ghost">
          الرئيسية
        </Link>
      </div>
    </div>
  );
}
