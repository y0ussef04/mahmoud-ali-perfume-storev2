export default function AdminShippingLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* رأس الصفحة */}
      <div className="pb-6 border-b border-hair-soft space-y-2">
        <div className="h-7 w-44 bg-ink/15 dark:bg-white/15 rounded" />
        <div className="h-4 w-60 bg-ink/10 dark:bg-white/10 rounded" />
      </div>

      {/* إعدادات الشحن العامة */}
      <div className="surface p-6 space-y-5">
        <div className="h-5 w-32 bg-ink/15 dark:bg-white/15 rounded" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-ink/10 dark:bg-white/10 rounded" />
              <div className="h-10 w-full bg-ink/5 dark:bg-white/5 rounded border border-hair-soft" />
            </div>
          ))}
        </div>
      </div>

      {/* جدول المحافظات */}
      <div className="surface p-6 space-y-4">
        <div className="h-5 w-36 bg-ink/15 dark:bg-white/15 rounded" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2.5 border-b border-hair-soft">
              <div className="h-4 w-24 bg-ink/15 dark:bg-white/15 rounded" />
              <div className="h-8 w-24 bg-ink/5 dark:bg-white/5 rounded border border-hair-soft" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
