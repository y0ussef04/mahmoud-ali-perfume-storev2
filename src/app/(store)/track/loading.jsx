export default function TrackLoading() {
  return (
    <div className="mx-auto max-w-wrap px-5 py-12 sm:px-8 sm:py-16 animate-pulse">
      <div className="mx-auto max-w-2xl">
        <header className="text-center space-y-3">
          <div className="mx-auto h-3 w-20 bg-amber-500/20 rounded" />
          <div className="mx-auto h-8 w-48 bg-ink/15 dark:bg-white/15 rounded" />
          <div className="mx-auto h-4 w-3/4 bg-ink/10 dark:bg-white/10 rounded" />
        </header>

        <div className="surface mt-9 grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
          <div className="space-y-2">
            <div className="h-3 w-16 bg-ink/10 dark:bg-white/10 rounded" />
            <div className="h-11 w-full bg-ink/5 dark:bg-white/5 rounded border border-hair-soft" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-16 bg-ink/10 dark:bg-white/10 rounded" />
            <div className="h-11 w-full bg-ink/5 dark:bg-white/5 rounded border border-hair-soft" />
          </div>
          <div className="sm:col-span-2">
            <div className="h-12 w-full bg-brass/20 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
