export default function JourneyLoading() {
  return (
    <div className="w-full max-w-xl mx-auto px-3 pt-4 pb-4 sm:p-6 space-y-4 sm:space-y-5 animate-pulse">
      {/* Header — icon+label / title / goal + trash button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-7 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>
        <div className="h-8 w-8 rounded-lg bg-muted shrink-0" />
      </div>

      {/* Banner image */}
      <div className="h-24 sm:h-32 w-full rounded-2xl bg-muted" />

      {/* Progress summary card */}
      <div className="h-24 w-full rounded-xl bg-muted" />

      {/* Obstacle nodes — matching pl-16 layout with dot + card */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="relative pl-16">
          <div className="absolute left-4 top-5 h-4 w-4 rounded-full bg-muted" />
          <div className="h-20 w-full rounded-xl bg-muted" />
        </div>
      ))}
    </div>
  );
}
