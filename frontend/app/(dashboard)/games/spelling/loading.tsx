/**
 * Shown instantly by Next.js App Router while SpellingGame loads.
 * Mirrors the start-screen layout so the transition is seamless.
 */
export default function SpellingGameLoading() {
  return (
    <div className="min-h-full flex flex-col animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex-shrink-0 flex items-center gap-2 px-6 py-4">
        <div className="w-4 h-4 rounded bg-muted" />
        <div className="w-32 h-4 rounded bg-muted" />
      </div>

      {/* Centred lobby skeleton */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-muted" />
          </div>

          {/* Heading */}
          <div className="text-center space-y-2">
            <div className="h-7 w-48 mx-auto rounded bg-muted" />
            <div className="h-4 w-64 mx-auto rounded bg-muted" />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border bg-card py-3 flex flex-col items-center gap-1.5">
                <div className="h-6 w-10 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
            ))}
          </div>

          {/* Rules */}
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-5/6 rounded bg-muted" />
          </div>

          {/* Personal best */}
          <div className="h-10 w-full rounded-xl bg-muted" />

          {/* CTA button */}
          <div className="h-11 w-full rounded-lg bg-primary/30" />
        </div>
      </div>
    </div>
  );
}
