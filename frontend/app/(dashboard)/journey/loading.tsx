export default function JourneyLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>
      {/* Banner skeleton */}
      <div className="rounded-2xl bg-muted h-40 w-full" />
      {/* Phase accordions */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-5 w-32 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
          </div>
          <div className="space-y-2">
            {[1, 2].map((j) => (
              <div key={j} className="h-14 rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
