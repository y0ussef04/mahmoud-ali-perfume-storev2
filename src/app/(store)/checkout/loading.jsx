export default function CheckoutLoading() {
  return (
    <div className="mx-auto max-w-wrap px-5 py-10 sm:px-8 sm:py-14 animate-pulse">
      {/* المسار */}
      <nav aria-label="جاري التحميل" className="mb-8 flex items-center gap-2">
        <div className="h-3 w-12 bg-ink/10 dark:bg-white/10 rounded" />
        <span className="text-brass">›</span>
        <div className="h-3 w-16 bg-ink/15 dark:bg-white/15 rounded" />
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr]">
        {/* الخطوات والنموذج */}
        <div className="space-y-6">
          {/* شريط التقدم */}
          <div className="flex border border-hair-soft bg-paper-warm/50 dark:bg-lacquer/40 h-11">
            <div className="flex-1 border-e border-hair-soft bg-lacquer/10" />
            <div className="flex-1 border-e border-hair-soft" />
            <div className="flex-1" />
          </div>

          {/* محتوى الخطوة */}
          <div className="surface p-6 sm:p-8 space-y-6">
            <div className="h-6 w-32 bg-ink/15 dark:bg-white/15 rounded" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-ink/10 dark:bg-white/10 rounded" />
                <div className="h-11 w-full bg-ink/5 dark:bg-white/5 rounded border border-hair-soft" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-16 bg-ink/10 dark:bg-white/10 rounded" />
                <div className="h-11 w-full bg-ink/5 dark:bg-white/5 rounded border border-hair-soft" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-3 w-20 bg-ink/10 dark:bg-white/10 rounded" />
              <div className="h-11 w-full bg-ink/5 dark:bg-white/5 rounded border border-hair-soft" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-ink/10 dark:bg-white/10 rounded" />
                <div className="h-11 w-full bg-ink/5 dark:bg-white/5 rounded border border-hair-soft" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-16 bg-ink/10 dark:bg-white/10 rounded" />
                <div className="h-11 w-full bg-ink/5 dark:bg-white/5 rounded border border-hair-soft" />
              </div>
            </div>

            <div className="h-12 w-full bg-brass/20 rounded mt-6" />
          </div>
        </div>

        {/* ملخص الطلب */}
        <div>
          <div className="surface p-6 space-y-5">
            <div className="h-5 w-24 bg-ink/15 dark:bg-white/15 rounded" />
            <div className="space-y-3 pt-2">
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-ink/10 dark:bg-white/10 rounded" />
                <div className="h-3 w-16 bg-ink/10 dark:bg-white/10 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-ink/10 dark:bg-white/10 rounded" />
                <div className="h-3 w-14 bg-ink/10 dark:bg-white/10 rounded" />
              </div>
              <div className="flex justify-between border-t border-hair-soft pt-3">
                <div className="h-5 w-20 bg-ink/20 dark:bg-white/20 rounded" />
                <div className="h-5 w-24 bg-ink/20 dark:bg-white/20 rounded" />
              </div>
            </div>
            <div className="h-11 w-full bg-ink/5 dark:bg-white/5 rounded border border-hair-soft mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
