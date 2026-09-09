'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { round2 } from '@/lib/totals';

/**
 * عربة التسوق — كلها في ذاكرة الصفحة (React state).
 * مافيش localStorage ولا sessionStorage بالمرة.
 * معناها إن العربة بتفضل موجودة أثناء التنقّل في الموقع،
 * وبتتفرّغ لو العميل عمل Refresh — وده مقصود.
 */
const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const notify = useCallback((text, tone = 'ok') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, tone, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  /**
   * @param {Object} v  { variantId, productId, slug, name, brandName,
   *                      label, price, stock, image }
   */
  const add = useCallback(
    (v, qty = 1) => {
      const want = Math.max(1, Math.floor(Number(qty) || 1));

      setItems((prev) => {
        const i = prev.findIndex((l) => l.variantId === v.variantId);

        if (i === -1) {
          const capped = Math.min(want, v.stock ?? want);
          return [...prev, { ...v, qty: capped }];
        }

        const next = [...prev];
        const line = next[i];
        const capped = Math.min(line.qty + want, line.stock ?? line.qty + want);
        next[i] = { ...line, qty: capped };
        return next;
      });

      notify(`${v.name} — ${v.label} أضيف للعربة`);
      setOpen(true);
    },
    [notify]
  );

  const setQty = useCallback((variantId, qty) => {
    const n = Math.floor(Number(qty) || 0);
    setItems((prev) => {
      if (n <= 0) return prev.filter((l) => l.variantId !== variantId);
      return prev.map((l) =>
        l.variantId === variantId
          ? { ...l, qty: Math.min(n, l.stock ?? n) }
          : l
      );
    });
  }, []);

  const remove = useCallback((variantId) => {
    setItems((prev) => prev.filter((l) => l.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => round2(items.reduce((a, l) => a + l.price * l.qty, 0)),
    [items]
  );

  const count = useMemo(
    () => items.reduce((a, l) => a + l.qty, 0),
    [items]
  );

  /** الشكل اللي الـ API بيستقبله — variant_id و qty بس */
  const payload = useMemo(
    () => items.map((l) => ({ variant_id: l.variantId, qty: l.qty })),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      count,
      subtotal,
      payload,
      add,
      setQty,
      remove,
      clear,
      open,
      setOpen,
      toast,
      notify,
    }),
    [items, count, subtotal, payload, add, setQty, remove, clear, open, toast, notify]
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart لازم يكون جوه <CartProvider>.');
  return ctx;
}
