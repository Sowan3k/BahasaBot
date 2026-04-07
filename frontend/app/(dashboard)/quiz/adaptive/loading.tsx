export default function QuizLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[480px] max-w-sm mx-auto px-6 gap-8 animate-pulse">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-muted" />
      {/* Heading */}
      <div className="text-center space-y-2 w-full">
        <div className="h-7 w-44 mx-auto rounded bg-muted" />
        <div className="h-4 w-64 mx-auto rounded bg-muted" />
        <div className="h-4 w-56 mx-auto rounded bg-muted" />
      </div>
      {/* Info grid */}
      <div className="w-full grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card py-3 flex flex-col items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-muted" />
            <div className="h-4 w-10 rounded bg-muted" />
            <div className="h-3 w-14 rounded bg-muted" />
          </div>
        ))}
      </div>
      {/* CTA */}
      <div className="h-11 w-full rounded-xl bg-primary/30" />
    </div>
  );
}
