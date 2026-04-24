export default function ChatbotLoading() {
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background animate-pulse">
      {/* Header — logo + title/subtitle + History + New chat buttons */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-background/90 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-muted shrink-0" />
          <div className="space-y-1">
            <div className="h-3.5 w-14 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-20 rounded-lg bg-muted" />
          <div className="h-7 w-20 rounded-lg bg-muted" />
        </div>
      </header>

      {/* Message area — welcome state placeholder */}
      <main className="flex-1 px-4 py-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-muted" />
          <div className="h-5 w-44 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
          <div className="h-4 w-56 rounded bg-muted" />
        </div>
      </main>

      {/* Input area */}
      <footer className="bg-background border-t px-4 py-3 shrink-0">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <div className="h-11 flex-1 rounded-xl bg-muted" />
          <div className="h-11 w-11 rounded-xl bg-muted shrink-0" />
        </div>
      </footer>
    </div>
  );
}
