export default function FaqLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-32 pt-10 md:px-10">
      {/* Hero */}
      <div className="mb-12 animate-pulse">
        <div className="mb-2 h-3 w-32 bg-muted-foreground/20 rounded" />
        <div className="h-10 w-80 bg-foreground/10 rounded-lg mb-4" />
        <div className="mt-3 h-4 w-[80%] max-w-xl bg-muted-foreground/10 rounded" />
      </div>

      {/* FAQ list */}
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-17 w-full rounded-2xl border border-white/6 bg-card/60 backdrop-blur-sm"
          />
        ))}
      </div>

      {/* Footer CTA */}
      <div className="mt-16 h-32 w-full rounded-2xl border border-accent/20 bg-accent/4 p-8 flex flex-col items-center justify-center animate-pulse">
        <div className="h-4 w-40 bg-foreground/20 rounded mb-3" />
        <div className="h-3 w-3/4 bg-muted-foreground/10 rounded" />
      </div>
    </div>
  );
}
