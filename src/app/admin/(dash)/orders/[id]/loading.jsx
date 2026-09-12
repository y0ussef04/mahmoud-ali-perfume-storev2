import { Panel } from '@/components/admin/ui';

export default function OrderDetailsSkeleton() {
  return (
    <div className="animate-pulse">
      {/* ── الرأس ── */}
      <header className="mb-7">
        <div className="h-8 w-28 bg-hair/30 rounded-lg mb-4" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="h-8 w-44 bg-hair/40 rounded-lg" />
            <div className="mt-2 h-4 w-52 bg-hair/20 rounded" />
          </div>

          <div className="flex items-center gap-2">
            <div className="h-7 w-20 bg-hair/30 rounded-full" />
            <div className="h-7 w-24 bg-hair/30 rounded-full" />
            <div className="h-8 w-28 bg-hair/30 rounded-lg" />
          </div>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        {/* ══ العمود الأول ══ */}
        <div className="space-y-5">
          {/* البنود */}
          <Panel title="البنود" hint="جاري تحميل المنتجات والأسعار...">
            <div className="overflow-x-auto space-y-3 py-2">
              <div className="h-10 w-full bg-hair/30 rounded-lg" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 w-full bg-hair/20 rounded-lg border border-hair/30 flex items-center justify-between px-4">
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 bg-hair/40 rounded" />
                    <div className="h-3 w-16 bg-hair/20 rounded" />
                  </div>
                  <div className="h-4 w-16 bg-hair/30 rounded" />
                  <div className="h-4 w-12 bg-hair/30 rounded" />
                  <div className="h-4 w-20 bg-hair/40 rounded" />
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3 border-t border-hair-soft pt-5">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-hair/30 rounded" />
                <div className="h-4 w-24 bg-hair/30 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-hair/30 rounded" />
                <div className="h-4 w-20 bg-hair/30 rounded" />
              </div>
              <div className="flex justify-between border-t border-hair pt-3">
                <div className="h-6 w-24 bg-hair/40 rounded" />
                <div className="h-6 w-32 bg-brass/20 rounded" />
              </div>
            </div>
          </Panel>

          {/* العميل */}
          <Panel title="العميل والعنوان">
            <div className="h-24 w-full bg-hair/20 rounded-lg border border-hair/30 p-4 space-y-2">
              <div className="h-4 w-40 bg-hair/40 rounded" />
              <div className="h-4 w-60 bg-hair/30 rounded" />
              <div className="h-4 w-48 bg-hair/20 rounded" />
            </div>
          </Panel>
        </div>

        {/* ══ العمود الثاني: الإجراءات ══ */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          <Panel title="الإجراءات">
            <div className="space-y-4 py-2">
              <div className="h-10 w-full bg-hair/30 rounded-lg" />
              <div className="h-10 w-full bg-hair/20 rounded-lg" />
              <div className="h-10 w-full bg-hair/20 rounded-lg" />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
