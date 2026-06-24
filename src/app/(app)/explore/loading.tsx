export default function ExploreLoading() {
  return (
    <div className="flex justify-center min-h-screen bg-background">
      <div className="flex w-full h-full" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <main className="flex-1 border-x border-border/50 animate-pulse">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 border-b border-border/50 bg-background/85 backdrop-blur-md px-4 py-3 flex items-center justify-between">
            <div className="h-4 w-20 bg-muted-foreground/20 rounded-sm" />
            <div className="h-3 w-16 bg-muted-foreground/10 rounded-sm" />
          </div>

          {/* Posts */}
          <div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border-b border-border/50 px-4 py-4">
                <div className="flex gap-3">
                  <div className="shrink-0 pt-0.5">
                    <div className="h-10 w-10 rounded-full bg-secondary border border-border" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-x-1.5 gap-y-1 mb-0.5">
                      <div className="h-4 w-24 bg-foreground/10 rounded-sm" />
                      <div className="h-3 w-16 bg-muted-foreground/10 rounded-sm" />
                      <div className="h-3 w-3 bg-muted-foreground/10 rounded-full" />
                      <div className="h-3 w-12 bg-muted-foreground/10 rounded-sm" />
                      <div className="ml-auto h-5 w-14 bg-foreground/5 rounded-full" />
                    </div>
                    <div className="h-5 w-48 bg-foreground/15 rounded-sm mb-2" />
                    <div className="space-y-1.5 mb-3">
                      <div className="h-3.5 w-full bg-muted-foreground/10 rounded-sm" />
                      <div className="h-3.5 w-[80%] bg-muted-foreground/10 rounded-sm" />
                    </div>
                    <div className="flex gap-1.5 mb-3">
                      <div className="h-4 w-12 bg-secondary/80 rounded-sm" />
                      <div className="h-4 w-16 bg-secondary/80 rounded-sm" />
                      <div className="h-4 w-14 bg-secondary/80 rounded-sm" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-2 w-2 bg-neutral-500 rounded-full" />
                      <div className="h-3 w-20 bg-muted-foreground/10 rounded-sm" />
                    </div>
                    
                    <div className="mt-2 h-32 w-full rounded-xl bg-secondary/20 border border-border/20" />

                    <div className="mt-3 flex items-center gap-1">
                      <div className="h-8 w-12 rounded-full bg-foreground/5" />
                      <div className="h-8 w-12 rounded-full bg-foreground/5" />
                      <div className="h-8 w-12 rounded-full bg-foreground/5" />
                      <div className="h-8 w-12 rounded-full bg-foreground/5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
        
        <aside className="hidden lg:flex w-[320px] flex-col border-l border-border/40 px-5 py-4 shrink-0 animate-pulse">
          <div className="sticky top-4 flex flex-col gap-4">
            <div className="rounded-2xl border border-border/40 bg-card/20 p-4">
              <div className="h-3 w-32 bg-muted-foreground/20 rounded-sm mb-4" />
              <div className="flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-3 w-3 bg-muted-foreground/10 rounded-sm shrink-0" />
                    <div className="h-3.5 w-24 bg-foreground/10 rounded-sm" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="h-3 w-48 bg-muted-foreground/10 rounded-sm mx-2" />
          </div>
        </aside>
      </div>
    </div>
  );
}
