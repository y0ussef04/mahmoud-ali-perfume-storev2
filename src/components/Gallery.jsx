'use client';

import Image from 'next/image';
import { useState } from 'react';
import ProductPhoto from '@/components/ProductPhoto';

/**
 * معرض صور العطر.
 * لو مافيش صورة أو فيه واحدة بس، بنرجع لـ ProductPhoto على طول
 * — مافيش داعي لأزرار تنقّل مالهاش لازمة.
 */
export default function Gallery({ product: p }) {
  const imgs = p.images || [];
  const [i, setI] = useState(0);

  if (imgs.length <= 1) return <ProductPhoto product={p} priority />;

  const current = imgs[Math.min(i, imgs.length - 1)];

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden bg-glass">
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt || p.name_ar}
          fill
          sizes="(min-width: 1024px) 28rem, 92vw"
          priority
          className="animate-bloom object-cover"
        />
      </div>

      <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {imgs.map((img, idx) => {
          const on = idx === i;
          return (
            <li key={img.url} className="shrink-0">
              <button
                type="button"
                onClick={() => setI(idx)}
                aria-pressed={on}
                className={`relative block h-16 w-16 overflow-hidden border transition-colors ${
                  on ? 'border-brass' : 'border-hair-soft hover:border-hair'
                }`}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
                <span className="sr-only">صورة {idx + 1}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
