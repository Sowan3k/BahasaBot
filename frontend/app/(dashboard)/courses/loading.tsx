export default function CoursesLoading() {
  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6 animate-pulse">
      {/* Header row */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-8 w-28 rounded bg-muted" />
          <div className="h-4 w-56 rounded bg-muted" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-muted shrink-0" />
      </div>

      {/* Course cards — mirror CourseCard structure */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card/90 overflow-hidden flex flex-col">
            {/* Cover image */}
            <div className="h-24 sm:h-32 w-full bg-muted flex-shrink-0" />
            {/* Content */}
            <div className="p-3 sm:p-5 space-y-2 sm:space-y-3 flex-1">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-5 w-full rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-2/5 rounded bg-muted" />
              <div className="h-1.5 w-full rounded-full bg-muted" />
            </div>
            {/* Delete row */}
            <div className="px-5 pb-4 pt-2 border-t border-border/50 flex justify-end">
              <div className="h-7 w-16 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
