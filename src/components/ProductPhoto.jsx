import Image from 'next/image';

/**
 * صورة العطر — وموجودة كمان لما مافيش صورة.
 * بدعم الحجم المصغر والتحكم في الأبعاد لتفادي تضخم الكارت.
 */
export default function ProductPhoto({
  product: p,
  priority = false,
  sizes = '(min-width: 1024px) 16rem, (min-width: 640px) 30vw, 45vw',
  className = '',
  aspect = 'aspect-[16/10] max-h-28 sm:max-h-36',
}) {
  const box = `relative ${aspect} w-full overflow-hidden bg-lacquer/20 ${className}`;

  if (p.cover) {
    return (
      <div className={box}>
        <Image
          src={p.cover}
          alt={p.images?.[0]?.alt || p.name_ar}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  const initials = (p.name_en || p.name_ar || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('');

  return (
    <div
      className={box}
      style={{
        backgroundImage: `linear-gradient(160deg,
          ${p.spine_top || '#C9A45C'}22 0%,
          ${p.spine_heart || '#8E3E44'}2E 52%,
          ${p.spine_base || '#3A2318'}3D 100%)`,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center font-mark
                   text-[2.2rem] tracking-wide3 text-oud/25"
      >
        {initials.toUpperCase()}
      </span>
    </div>
  );
}

