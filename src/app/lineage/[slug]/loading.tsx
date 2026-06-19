export default function LineageLoading() {
  return (
    <div className="relative h-screen w-full bg-[#050505] overflow-hidden animate-pulse">
      {/* Absolute Cinematic Header */}
      <div className="pointer-events-none absolute left-0 top-0 z-50 w-full bg-gradient-to-b from-black/80 to-transparent pt-12 pb-24 px-8">
        <div className="h-3 w-32 bg-emerald-500/20 rounded-sm mb-3" />
        <div className="h-8 w-64 bg-foreground/10 rounded-xl mb-3" />
        <div className="h-3 w-48 bg-muted-foreground/10 rounded-sm mb-6" />
        <div className="h-8 w-40 bg-emerald-500/10 rounded-full" />
      </div>
    </div>
  );
}
