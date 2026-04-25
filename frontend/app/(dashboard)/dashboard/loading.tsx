export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="h-8 sm:h-9 w-36 rounded bg-muted" />
        <div className="h-4 w-72 rounded bg-muted" />
      </div>

      {/* Tab strip — 5 tabs matching Overview/Vocabulary/Grammar/Quiz History/Leaderboard */}
      <div className="flex gap-0.5 sm:gap-1 border-b pb-0">
        {[80, 72, 64, 88, 96].map((w, i) => (
          <div key={i} className={`h-9 rounded-t bg-muted`} style={{ width: w }} />
        ))}
      </div>

      {/* Stat cards — 8 cards matching StatsCards grid */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="list-none h-28 sm:h-40 rounded-[1.25rem] bg-muted" />
        ))}
      </ul>

      {/* BPS progress bar */}
      <div className="h-[140px] w-full rounded-[1.25rem] bg-muted" />

      {/* Weak points + quiz history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-[1.25rem] bg-muted" />
        <div className="h-64 rounded-[1.25rem] bg-muted" />
      </div>
    </div>
  );
}
