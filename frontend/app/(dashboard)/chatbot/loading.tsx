export default function ChatbotLoading() {
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background animate-pulse">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-muted" />
          <div className="space-y-1">
            <div className="h-3.5 w-16 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
        </div>
        <div className="h-7 w-20 rounded-lg bg-muted" />
      </header>
      {/* Message area */}
      <main className="flex-1 px-4 py-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-muted" />
          <div className="h-5 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>
      </main>
      {/* Input */}
      <footer className="bg-card border-t px-4 py-3 shrink-0">
        <div className="h-11 w-full max-w-3xl mx-auto rounded-xl bg-muted" />
      </footer>
    </div>
  );
}
