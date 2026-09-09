import { IBM_Plex_Sans_Arabic, Aref_Ruqaa, Cinzel } from 'next/font/google';
import './globals.css';

const body = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--f-body',
  display: 'swap',
});

const display = Aref_Ruqaa({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--f-display',
  display: 'swap',
});

const mark = Cinzel({
  subsets: ['latin'],
  variable: '--f-mark',
  display: 'swap',
});

export const metadata = {
  title: {
    default: "Mahmoud-Ali's store",
    template: "%s · Mahmoud-Ali's store",
  },
  description:
    'كاتالوج كامل بأسعار وأحجام واضحة لعطور خليجية أصلية ١٠٠٪. اطلب في دقيقة، ادفع عند الاستلام أو بالكارت أو بالتحويل.',
  keywords: [
    'عطور خليجية',
    'عطور إماراتية',
    'عطور سعودية',
    'لطافة',
    'العربية للعود',
    'دهن عود',
    'مخلط',
    'عطور أصلية مصر',
  ],
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    siteName: "Mahmoud-Ali's store",
    title: "Mahmoud-Ali's store",
    description: 'عطور إماراتية وسعودية أصلية ١٠٠٪ — أسعار واضحة وتوصيل لكل مصر.',
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

// بيتزرق قبل أي رسم عشان مايحصلش وميض (FOUC) وقت تحميل الثيم الداكن.
// بيقرا تفضيل المستخدم من localStorage، وإلا بيمشي على تفضيل النظام.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(_){}})();`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${body.variable} ${display.variable} ${mark.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
