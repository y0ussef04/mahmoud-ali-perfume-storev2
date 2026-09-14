import Image from 'next/image';

export default function ProductPhoto({
  product: p,
  priority = false,
  sizes = '(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw',
  className = '',
}) {
  const box = `relative aspect-square md:aspect-[3/4] max-h-[340px] md:max-h-none w-full rounded-xl overflow-hidden bg-[#FAF9F5] dark:bg-[#151410] flex items-center justify-center p-3 border border-[#E8E6E1]/50 dark:border-[#2E2B22]/50 ${className}`;

  if (p?.cover) {
    return (
      <div className={box}>
        <Image
          src={p.cover}
          alt={p.images?.[0]?.alt || p.name_ar}
          fill
          sizes={sizes}
          priority={priority}
          className="object-contain p-2 group-hover:scale-[1.04] transition-transform duration-300"
        />
      </div>
    );
  }

  const initials = (p?.name_en || p?.name_ar || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('');

  return (
    <div
      className={`${box} flex items-center justify-center`}
      style={{
        backgroundImage: `linear-gradient(160deg,
          ${p?.spine_top || '#C9A84C'}22 0%,
          ${p?.spine_heart || '#B85B6C'}2E 52%,
          ${p?.spine_base || '#1A1814'}3D 100%)`,
      }}
    >
      <span
        aria-hidden="true"
        className="font-bold text-2xl tracking-widest text-[#1A1814]/30 dark:text-white/30 uppercase"
      >
        {initials || 'MA'}
      </span>
    </div>
  );
}
