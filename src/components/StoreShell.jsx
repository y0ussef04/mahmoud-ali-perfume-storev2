'use client';

import { CartProvider } from '@/lib/cart';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import MobileQuickBar from '@/components/MobileQuickBar';
import Toast from '@/components/Toast';
import { settingNum } from '@/lib/totals';

/**
 * قشرة المتجر — بتغلّف الصفحات كلها بمزوّد العربة.
 * الهيدر والدروار والتوست كلهم محتاجين نفس الـ context،
 * فلازم يكونوا جوّاه، وعشان كده الملف ده client component.
 */
export default function StoreShell({ settings, children }) {
  return (
    <CartProvider>
      <Header settings={settings} announcement={settings?.announcement || ''} freeShipThreshold={settingNum(settings?.free_ship_threshold, 1500)} />
      <main className="min-h-[60vh] pb-24 md:pb-8">{children}</main>
      <CartDrawer freeShipThreshold={settingNum(settings?.free_ship_threshold, 1500)} />
      <MobileQuickBar waNumber={settings?.wa_number || ''} />
      <Toast />
    </CartProvider>
  );
}
