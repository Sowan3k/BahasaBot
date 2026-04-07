export default function AdminLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 w-36 rounded bg-muted" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-2">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-8 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="h-5 w-28 rounded bg-muted" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="h-4 flex-1 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
