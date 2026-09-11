export default function AdminAccountsLoading() {
  return (
    <div className="animate-pulse space-y-8">
      {/* رأس الصفحة */}
      <div className="pb-6 border-b border-hair-soft space-y-2">
        <div className="h-7 w-48 bg-ink/15 dark:bg-white/15 rounded" />
        <div className="h-4 w-64 bg-ink/10 dark:bg-white/10 rounded" />
      </div>

      {/* قائمة المديرين التمهيدية */}
      <div className="surface p-5 sm:p-6 space-y-4">
        <div className="h-5 w-36 bg-ink/15 dark:bg-white/15 rounded" />
        <div className="space-y-3 pt-2">
          <div className="h-9 w-full bg-ink/5 dark:bg-white/5 rounded border-b border-hair-soft" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-hair-soft">
              <div className="space-y-1">
                <div className="h-4 w-28 bg-ink/15 dark:bg-white/15 rounded" />
                <div className="h-3 w-40 bg-ink/10 dark:bg-white/10 rounded" />
              </div>
              <div className="h-6 w-16 bg-ink/10 dark:bg-white/10 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* نموذج إضافة مدير */}
      <div className="surface p-5 sm:p-6 space-y-4">
        <div className="h-5 w-32 bg-ink/15 dark:bg-white/15 rounded" />
        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="h-10 w-full bg-ink/5 dark:bg-white/5 rounded" />
          <div className="h-10 w-full bg-ink/5 dark:bg-white/5 rounded" />
          <div className="h-10 w-full bg-ink/5 dark:bg-white/5 rounded" />
          <div className="h-10 w-full bg-ink/5 dark:bg-white/5 rounded" />
        </div>
      </div>
    </div>
  );
}
