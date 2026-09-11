export default function AdminProductsLoading() {
  return (
    <div className="animate-pulse space-y-5">
      {/* رأس الصفحة */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-hair-soft">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-ink/15 dark:bg-white/15 rounded" />
          <div className="h-4 w-44 bg-ink/10 dark:bg-white/10 rounded" />
        </div>
        <div className="h-9 w-24 bg-ink/20 dark:bg-white/20 rounded" />
      </div>

      {/* الفلاتر */}
      <div className="surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[13rem] flex-1 space-y-2">
            <div className="h-3 w-16 bg-ink/10 dark:bg-white/10 rounded" />
            <div className="h-10 w-full bg-ink/5 dark:bg-white/5 rounded border border-hair-soft" />
          </div>
          <div className="w-36 space-y-2">
            <div className="h-3 w-12 bg-ink/10 dark:bg-white/10 rounded" />
            <div className="h-10 w-full bg-ink/5 dark:bg-white/5 rounded border border-hair-soft" />
          </div>
          <div className="w-32 space-y-2">
            <div className="h-3 w-12 bg-ink/10 dark:bg-white/10 rounded" />
            <div className="h-10 w-full bg-ink/5 dark:bg-white/5 rounded border border-hair-soft" />
          </div>
          <div className="h-10 w-16 bg-ink/10 dark:bg-white/10 rounded" />
        </div>
      </div>

      {/* جدول العطور */}
      <div className="surface overflow-x-auto p-4">
        <div className="space-y-3">
          <div className="h-9 w-full bg-ink/5 dark:bg-white/5 rounded border-b border-hair-soft" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3.5 border-b border-hair-soft">
              <div className="flex items-center gap-4">
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-ink/15 dark:bg-white/15 rounded" />
                  <div className="h-3 w-20 bg-ink/10 dark:bg-white/10 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="h-4 w-20 bg-ink/10 dark:bg-white/10 rounded" />
                <div className="h-4 w-16 bg-ink/15 dark:bg-white/15 rounded" />
                <div className="h-6 w-16 bg-ink/10 dark:bg-white/10 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
