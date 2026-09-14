import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600'],
  variable: '--f-sans',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'محمود علي للعطور — عطور خليجية أصلية',
    template: '%s · محمود علي للعطور',
  },
  description:
    'عطور إماراتية وسعودية أصلية ١٠٠٪ في مصر. أسعار واضحة بدون رسائل خاصة، طلب فورى ودفع عند الاستلام أو بالتحويل.',
  keywords: [
    'عطور خليجية',
    'عطور إماراتية',
    'عطور سعودية',
    'لطافة',
    'العربية للعود',
    'دهن عود',
    'مخلط',
    'محمود علي للعطور',
  ],
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    siteName: 'متجر محمود علي للعطور',
    title: 'محمود علي للعطور — عطور خليجية أصلية',
    description: 'عطور إماراتية وسعودية أصلية ١٠٠٪ — أسعار واضحة وتوصيل لكل مصر.',
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF8' },
    { media: '(prefers-color-scheme: dark)', color: '#111009' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(_){}})();`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlexSansArabic.variable} font-sans`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="bg-[#FAFAF8] text-[#1A1814] antialiased selection:bg-[#C9A84C]/20 dark:bg-[#111009] dark:text-white min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
