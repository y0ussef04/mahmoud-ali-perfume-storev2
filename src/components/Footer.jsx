import Link from 'next/link';
import { Mark } from '@/components/Logo';

const DEV_PHONE = '01027780575';
const DEV_TEL = '+201027780575';

export default function Footer({ settings }) {
  const wa = settings?.wa_number || '';
  const storeName = settings?.store_name || "محمود علي للعطور";
  const year = new Date().getFullYear();

  const waUrl = wa
    ? `https://wa.me/${wa.replace(/\D/g, '')}?text=${encodeURIComponent('السلام عليكم، محتاج استفسار عن العطور المتاحة')}`
    : '#';

  return (
    <footer className="mt-20 border-t border-[#E8E6E1] dark:border-[#2E2B22] bg-[#1A1814] text-white">
      {/* Upper Grid Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Brand & Logo */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <Mark size={44} />
              <div>
                <h3 className="font-semibold text-lg text-white">محمود علي للعطور</h3>
                <span className="text-xs text-[#C9A84C] tracking-wide block">عطور خليجية فاخرة</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#A09C94] leading-relaxed">
              متجر متخصص في توفير أرقى العطور الخليجية (الإماراتية والسعودية) الأصلية ١٠٠٪ في مصر بأسعار وتفاصيل شفافة.
            </p>
            <div className="flex items-center gap-3 pt-1 text-xs text-[#C9A84C]">
              <span>✦ أصالة مضمونة</span>
              <span>•</span>
              <span>✦ شحن مجاني</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#C9A84C] tracking-wide">أقسام المتجر</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#A09C94]">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  الصفحة الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  جميع العطور (الكتالوج)
                </Link>
              </li>
              <li>
                <Link href="/products?family=set" className="hover:text-white transition-colors">
                  طقم عينات النخبة
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-white transition-colors">
                  تتبع حالة الطلب
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Services */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#C9A84C] tracking-wide">الخدمات والضمانات</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#A09C94]">
              <li>عطور مستوردة وأصلية ١٠٠٪</li>
              <li>شحن مجاني للطلبات فوق ١,٥٠٠ ج.م</li>
              <li>الدفع كاش عند الاستلام أو بالفيزا</li>
              <li>تغليف فاخر وآمن للشحنات</li>
            </ul>
          </div>

          {/* Column 4: Direct Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#C9A84C] tracking-wide">التواصل والدعم</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#A09C94]">
              <li className="text-white font-medium">الإدارة: محمود علي</li>
              <li>توصيل شامل لكل محافظات مصر</li>
              {wa ? (
                <li className="pt-1">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <span>واتساب خدمة العملاء</span>
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-[#2E2B22] bg-[#111009]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A09C94]">
          <p>© {year} {storeName}. جميع الحقوق محفوظة.</p>
          <p className="flex items-center gap-1.5">
            <span>تطوير الموقع:</span>
            <a
              href={`tel:${DEV_TEL}`}
              className="text-[#C9A84C] hover:underline font-semibold"
            >
              Youssef Refaat
            </a>
            <span className="text-[#A09C94]/50">·</span>
            <a
              href={`tel:${DEV_TEL}`}
              dir="ltr"
              className="num text-[#A09C94] hover:text-white"
            >
              {DEV_PHONE}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
