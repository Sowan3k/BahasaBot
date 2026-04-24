export default function AdminLoading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-pulse">
      {/* Header — icon + title + subtitle */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
        <div className="space-y-2">
          <div className="h-6 w-36 rounded bg-muted" />
          <div className="h-4 w-52 rounded bg-muted" />
        </div>
      </div>

      {/* Stat cards — 7 cards in grid-cols-2 lg:grid-cols-3 matching StatCard */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted" />
        ))}
      </div>

      {/* Navigation section header */}
      <div className="space-y-3">
        <div className="h-5 w-20 rounded bg-muted" />
        {/* Nav list — 4 items matching ADMIN_SECTIONS */}
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-lg bg-muted shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
              </div>
              <div className="w-4 h-4 rounded bg-muted shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
