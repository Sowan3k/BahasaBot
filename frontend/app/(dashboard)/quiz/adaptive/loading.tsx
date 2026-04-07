export default function QuizLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full gap-6 py-16 animate-pulse px-4">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-primary/30" />
      </div>
      <div className="text-center space-y-2">
        <div className="h-6 w-48 mx-auto rounded bg-muted" />
        <div className="h-4 w-64 mx-auto rounded bg-muted" />
      </div>
      <div className="w-full max-w-md space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
            <div className="h-4 flex-1 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
