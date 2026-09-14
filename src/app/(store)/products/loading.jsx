/*
 * DESIGN DECISIONS:
 * Layout: Luxury skeleton loading state matching the responsive grid (1 col mobile, 2 cols tablet, 4 cols desktop).
 * Visuals: Subtle pulse animation using the existing brand palette (#E8E6E1, #FAFAF8, #1C1A14, #2E2B22).
 */

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-wrap px-4 py-12 space-y-8 animate-pulse" aria-busy="true" aria-label="جاري تحميل الكتالوج">
      {/* رأس الصفحة التمهيدي */}
      <div className="space-y-3 max-w-2xl">
        <div className="h-3.5 w-20 bg-[#C9A84C]/30 rounded" />
        <div className="h-8 w-60 bg-[#E8E6E1] dark:bg-[#2E2B22] rounded-lg" />
        <div className="h-4 w-full max-w-md bg-[#E8E6E1]/60 dark:bg-[#25221B] rounded" />
      </div>

      <div className="h-px bg-[#E8E6E1] dark:bg-[#2E2B22]" />

      {/* شريط البحث والفلاتر التمهيدي */}
      <div className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-4 sm:p-6 space-y-4">
        <div className="h-11 w-full bg-[#FAFAF8] dark:bg-[#111009] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-lg" />
        <div className="flex gap-2 overflow-hidden pt-1">
          <div className="h-9 w-16 bg-[#1A1814]/15 dark:bg-white/15 rounded-lg shrink-0" />
          <div className="h-9 w-24 bg-[#E8E6E1]/70 dark:bg-[#2E2B22] rounded-lg shrink-0" />
          <div className="h-9 w-24 bg-[#E8E6E1]/70 dark:bg-[#2E2B22] rounded-lg shrink-0" />
          <div className="h-9 w-24 bg-[#E8E6E1]/70 dark:bg-[#2E2B22] rounded-lg shrink-0" />
        </div>
      </div>

      {/* شبكة الكروت التمهيدية (1 بالموبايل، 2 بالتابلت، 4 بالكمبيوتر) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-md md:max-w-none mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#1C1A14] border border-[#E8E6E1] dark:border-[#2E2B22] rounded-xl p-4 space-y-3"
          >
            {/* مكان الصورة */}
            <div className="aspect-[3/4] w-full rounded-lg bg-[#FAFAF8] dark:bg-[#151410] border border-[#E8E6E1]/60 dark:border-[#2E2B22]" />
            {/* الماركة */}
            <div className="h-3 w-1/3 bg-[#C9A84C]/25 rounded" />
            {/* اسم العطر */}
            <div className="h-5 w-3/4 bg-[#E8E6E1] dark:bg-[#2E2B22] rounded" />
            {/* السعر والحجم */}
            <div className="pt-2 border-t border-[#E8E6E1] dark:border-[#2E2B22] flex items-center justify-between">
              <div className="h-5 w-20 bg-[#E8E6E1] dark:bg-[#2E2B22] rounded" />
              <div className="h-4 w-12 bg-[#E8E6E1]/60 dark:bg-[#2E2B22] rounded" />
            </div>
            {/* الزر */}
            <div className="h-11 w-full bg-[#1A1814]/10 dark:bg-white/10 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
