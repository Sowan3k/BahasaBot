export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6 animate-pulse">
      <div className="space-y-1.5">
        <div className="h-8 w-28 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>
      {/* GlowCard list — 4 items matching SETTINGS_ITEMS */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-3 w-48 rounded bg-muted" />
            </div>
            <div className="w-4 h-4 rounded bg-muted shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
