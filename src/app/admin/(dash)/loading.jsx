export default function AdminDashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-hair-soft">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-ink/15 dark:bg-white/15 rounded" />
          <div className="h-4 w-48 bg-ink/10 dark:bg-white/10 rounded" />
        </div>
        <div className="flex gap-1 h-9 w-48 bg-ink/5 dark:bg-white/5 rounded border border-hair-soft" />
      </div>

      {/* الـ 5 كروت KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="surface p-5 space-y-3">
            <div className="h-3 w-16 bg-ink/10 dark:bg-white/10 rounded" />
            <div className="h-7 w-28 bg-ink/20 dark:bg-white/20 rounded" />
            <div className="h-3 w-20 bg-ink/5 dark:bg-white/5 rounded" />
          </div>
        ))}
      </div>

      {/* الرسوم البيانية */}
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="surface p-5 sm:p-6 space-y-4">
          <div className="h-5 w-32 bg-ink/15 dark:bg-white/15 rounded" />
          <div className="h-64 w-full bg-ink/5 dark:bg-white/5 rounded" />
        </div>
        <div className="surface p-5 sm:p-6 space-y-4">
          <div className="h-5 w-24 bg-ink/15 dark:bg-white/15 rounded" />
          <div className="h-64 w-full bg-ink/5 dark:bg-white/5 rounded" />
        </div>
      </div>

      {/* الجداول السفلية */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="surface p-5 sm:p-6 space-y-4">
          <div className="h-5 w-36 bg-ink/15 dark:bg-white/15 rounded" />
          <div className="space-y-2 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-full bg-ink/5 dark:bg-white/5 rounded" />
            ))}
          </div>
        </div>
        <div className="surface p-5 sm:p-6 space-y-4">
          <div className="h-5 w-36 bg-ink/15 dark:bg-white/15 rounded" />
          <div className="space-y-2 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-full bg-ink/5 dark:bg-white/5 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
