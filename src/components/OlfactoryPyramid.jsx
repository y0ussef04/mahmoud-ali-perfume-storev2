'use client';

/**
 * الهرم العطري البصري (Olfactory Pyramid Visualizer)
 * يعرض نوتات العطر في ٣ طبقات زجاجية متدرجة (المقدمة، القلب، القاعدة)
 */
export default function OlfactoryPyramid({ top = [], heart = [], base = [] }) {
  if (!top.length && !heart.length && !base.length) return null;

  const tiers = [
    {
      title: 'مقدّمة العطر',
      subtitle: 'أول 15-30 دقيقة',
      icon: '✨',
      notes: top,
      border: 'border-brass-gilt/40',
      bg: 'bg-brass-gilt/10',
    },
    {
      title: 'قلب العطر',
      subtitle: 'قلب العطر والثبات الأساسي',
      icon: '🌿',
      notes: heart,
      border: 'border-brass/40',
      bg: 'bg-brass/10',
    },
    {
      title: 'قاعدة العطر',
      subtitle: 'الاستقرار والفوحان الطويل',
      icon: '🪵',
      notes: base,
      border: 'border-espresso/40 dark:border-brass-light/30',
      bg: 'bg-espresso/5 dark:bg-brass-light/5',
    },
  ];

  return (
    <div className="surface my-6 p-5 space-y-3 rounded-sm">
      <div className="flex items-center justify-between border-b border-hair-soft pb-3">
        <h4 className="font-display text-d1 text-brass-gilt flex items-center gap-2">
          <span>🧪</span> الهرم العطري والمكونات
        </h4>
        <span className="text-xs2 text-ink-60">تطور الرائحة على الجلد</span>
      </div>

      <div className="space-y-2.5 pt-2">
        {tiers.map(
          (t) =>
            t.notes.length > 0 && (
              <div
                key={t.title}
                className={`p-3.5 border ${t.border} ${t.bg} transition-all duration-200 hover:border-brass`}
                style={{ borderRadius: 3 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs1 font-medium text-oud flex items-center gap-1.5">
                    <span>{t.icon}</span> {t.title}
                  </span>
                  <span className="text-xs2 text-ink-42">{t.subtitle}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {t.notes.map((note) => (
                    <span
                      key={note}
                      className="inline-block border border-hair-soft bg-glass px-2.5 py-1 text-xs2 text-ink-60 rounded-xs"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
}
