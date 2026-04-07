export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-4 animate-pulse">
      <div className="h-8 w-32 rounded bg-muted" />
      <div className="h-4 w-56 rounded bg-muted" />
      <div className="rounded-xl border bg-card divide-y divide-border overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted" />
              <div className="space-y-1.5">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-3 w-40 rounded bg-muted" />
              </div>
            </div>
            <div className="w-4 h-4 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
