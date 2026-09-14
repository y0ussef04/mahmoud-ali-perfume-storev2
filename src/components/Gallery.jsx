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
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#FAF9F5] dark:bg-[#151410] border border-[#E8E6E1] dark:border-[#2E2B22] p-4 flex items-center justify-center">
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt || p.name_ar}
          fill
          sizes="(min-width: 1024px) 28rem, 92vw"
          priority
          className="animate-bloom object-contain p-3"
        />
      </div>

      <ul className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
        {imgs.map((img, idx) => {
          const on = idx === i;
          return (
            <li key={img.url} className="shrink-0">
              <button
                type="button"
                onClick={() => setI(idx)}
                aria-pressed={on}
                className={`relative block h-16 w-16 rounded-xl overflow-hidden border bg-[#FAF9F5] dark:bg-[#151410] transition-all p-1 ${
                  on ? 'border-[#C9A84C] ring-2 ring-[#C9A84C]/30' : 'border-[#E8E6E1] dark:border-[#2E2B22] opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-contain p-1"
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
