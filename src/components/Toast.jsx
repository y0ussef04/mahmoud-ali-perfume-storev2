'use client';

import { useCart } from '@/lib/cart';

export default function Toast() {
  const { toast } = useCart();

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-6 z-[60] flex justify-center px-4"
      style={{ insetInlineStart: 0, insetInlineEnd: 0 }}
    >
      {toast ? (
        <p
          key={toast.id}
          className={`animate-bloom border px-5 py-3 text-xs1 shadow-lg ${
            toast.tone === 'bad'
              ? 'border-danger-solid bg-danger-solid text-white'
              : 'border-lacquer bg-lacquer text-brass-gilt'
          }`}
          style={{ borderRadius: 2 }}
        >
          {toast.text}
        </p>
      ) : null}
    </div>
  );
}
