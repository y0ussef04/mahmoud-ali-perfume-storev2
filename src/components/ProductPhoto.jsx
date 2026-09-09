import Image from 'next/image';

/**
 * صورة العطر — وموجودة كمان لما مافيش صورة.
 * البديل مش مربع رمادي: بنرسم تدرّج من ألوان عمود الرائحة نفسه
 * وناخد أول حرفين من الاسم اللاتيني. كده الكاتالوج يفضل متناسق
 * حتى لو محمود لسه مارفعش صور لكل عطر.
 */
export default function ProductPhoto({
  product: p,
  priority = false,
  sizes = '(min-width: 1024px) 24rem, (min-width: 640px) 45vw, 92vw',
  className = '',
}) {
  const box = `relative aspect-square w-full overflow-hidden bg-glass ${className}`;

  if (p.cover) {
    return (
      <div className={box}>
        <Image
          src={p.cover}
          alt={p.images?.[0]?.alt || p.name_ar}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
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
                   text-[2.6rem] tracking-wide3 text-oud/25"
      >
        {initials.toUpperCase()}
      </span>
    </div>
  );
}
