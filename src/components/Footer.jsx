import Link from 'next/link';
import { Mark } from '@/components/Logo';

const DEV_PHONE = '01027780575';
const DEV_TEL = '+201027780575';

export default function Footer({ settings }) {
  const wa = settings?.wa_number || '';
  const storeName = settings?.store_name || "Mahmoud-Ali's store";
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-hair bg-lacquer text-brass/75">
      <div className="mx-auto grid max-w-wrap gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Mark size={52} />
          <p className="mt-5 font-mark text-xs1 tracking-wide3 text-brass-gilt">
            MAHMOUD-ALI&apos;S STORE
          </p>
          <p className="mt-2 max-w-sm text-xs1 leading-relaxed">
            متجر محمود علي — عطور إماراتية وسعودية أصلية بأسعار وأحجام واضحة.
            مفيش مفاوضة في الرسايل ومفيش أسعار مخفية.
          </p>
        </div>

        <nav aria-label="روابط الموقع">
          <h2 className="font-display text-d1 text-brass-gilt">الموقع</h2>
          <ul className="mt-4 space-y-2.5 text-xs1">
            <li>
              <Link href="/products" className="hover:text-brass-gilt">
                كل العطور
              </Link>
            </li>
            <li>
              <Link href="/track" className="hover:text-brass-gilt">
                تتبع أوردر
              </Link>
            </li>
            <li>
              <Link href="/products?family=set" className="hover:text-brass-gilt">
                أطقم العيّنات
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-d1 text-brass-gilt">تواصل المتجر</h2>
          <ul className="mt-4 space-y-2.5 text-xs1">
            <li className="text-brass-gilt">صاحب المتجر: محمود علي</li>
            {wa ? (
              <li>
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brass-gilt"
                >
                  واتساب الطلبات
                </a>
              </li>
            ) : null}
            <li className="text-brass/55">توصيل لكل محافظات مصر</li>
            <li className="text-brass/55">استبدال في ٧ أيام لو العطر مقفول</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-brass/20">
        <div className="mx-auto flex max-w-wrap flex-col items-center gap-2 px-4 py-5 text-center text-xs2 text-brass/45 sm:flex-row sm:justify-between sm:text-start">
          <p>
            © {year} {storeName}. All rights reserved.
          </p>
          <p>
            تطوير الموقع:{' '}
            <a
              href={`tel:${DEV_TEL}`}
              className="text-brass/70 hover:text-brass-gilt"
              title="اتصال بالمطور"
            >
              Youssef Refaat
            </a>
            {' · '}
            <a
              href={`tel:${DEV_TEL}`}
              className="num text-brass/70 hover:text-brass-gilt"
              dir="ltr"
            >
              {DEV_PHONE}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
