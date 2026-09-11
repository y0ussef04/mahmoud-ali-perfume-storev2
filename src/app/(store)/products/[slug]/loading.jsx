export default function ProductDetailsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 pb-24 md:pb-12 animate-pulse">
      {/* المسار */}
      <nav aria-label="جاري التحميل" className="flex items-center gap-2">
        <div className="h-3 w-14 bg-ink/10 dark:bg-white/10 rounded" />
        <span className="text-ink-42">/</span>
        <div className="h-3 w-16 bg-ink/10 dark:bg-white/10 rounded" />
        <span className="text-ink-42">/</span>
        <div className="h-3 w-28 bg-ink/15 dark:bg-white/15 rounded" />
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        {/* العمود الأول: الهوية والنوتات */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-24 bg-amber-500/10 rounded-full" />
              <div className="h-3 w-12 bg-ink/10 dark:bg-white/10 rounded" />
            </div>

            <div className="h-8 w-3/4 bg-ink/15 dark:bg-white/15 rounded-md" />
            <div className="h-4 w-1/2 bg-ink/10 dark:bg-white/10 rounded" />
            <div className="h-3 w-1/3 bg-ink/10 dark:bg-white/10 rounded" />
          </div>

          {/* شريط النوتات */}
          <div className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-4 space-y-3">
            <div className="h-4 w-28 bg-ink/10 dark:bg-white/10 rounded" />
            <div className="h-6 w-full bg-ink/10 dark:bg-white/10 rounded-lg" />
          </div>

          {/* الوصف */}
          <div className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-5 space-y-3">
            <div className="h-4 w-20 bg-ink/10 dark:bg-white/10 rounded" />
            <div className="h-3 w-full bg-ink/10 dark:bg-white/10 rounded" />
            <div className="h-3 w-5/6 bg-ink/10 dark:bg-white/10 rounded" />
          </div>

          {/* الثبات والفوحان */}
          <div className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-5 space-y-4">
            <div className="h-4 w-24 bg-ink/10 dark:bg-white/10 rounded" />
            <div className="h-3 w-full bg-ink/10 dark:bg-white/10 rounded" />
            <div className="h-3 w-full bg-ink/10 dark:bg-white/10 rounded" />
          </div>
        </div>

        {/* العمود الثاني: المعرض والشراء */}
        <div className="space-y-6">
          <div className="aspect-[4/5] w-full max-w-[420px] mx-auto rounded-2xl bg-ink/10 dark:bg-white/10 border border-[#E8E6E1] dark:border-[#2E2B22]" />

          <div className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-6 space-y-6">
            <div className="h-8 w-36 bg-ink/15 dark:bg-white/15 rounded" />
            <div className="flex gap-2">
              <div className="h-10 w-24 bg-ink/10 dark:bg-white/10 rounded-lg" />
              <div className="h-10 w-24 bg-ink/10 dark:bg-white/10 rounded-lg" />
            </div>
            <div className="h-12 w-full bg-amber-500/20 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
