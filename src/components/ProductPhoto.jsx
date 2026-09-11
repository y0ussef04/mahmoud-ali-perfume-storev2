import Image from 'next/image';

export default function ProductPhoto({
  product: p,
  priority = false,
  sizes = '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw',
  className = '',
}) {
  const box = `relative aspect-[3/4] max-h-[380px] sm:max-h-none w-full rounded-xl overflow-hidden bg-[#FAFAF8] dark:bg-[#1C1A14] ${className}`;

  if (p?.cover) {
    return (
      <div className={box}>
        <Image
          src={p.cover}
          alt={p.images?.[0]?.alt || p.name_ar}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-300"
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
