'use client';

import { CartProvider } from '@/lib/cart';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
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
      <Header announcement={settings?.announcement || ''} />
      <main className="min-h-[60vh]">{children}</main>
      <CartDrawer freeShipThreshold={settingNum(settings?.free_ship_threshold, 1500)} />
      <Toast />
    </CartProvider>
  );
}
