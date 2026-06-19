import { Mail } from 'lucide-react';

export default function ContactLoading() {
  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden py-24 animate-pulse">
      {/* Background ambient glows */}
      <div className="absolute top-[10%] right-[-5%] h-[400px] w-[400px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-3xl px-4 relative z-10">
        <div className="text-center mb-16 flex flex-col items-center">
          <Mail className="mx-auto h-10 w-10 text-accent/50 mb-6" />
          <div className="h-10 sm:h-12 w-3/4 max-w-md bg-foreground/10 rounded-xl mb-4" />
          <div className="h-5 w-full max-w-xl bg-muted-foreground/10 rounded-md" />
        </div>

        <div className="rounded-2xl border border-border/30 bg-card/20 p-6 sm:p-10 backdrop-blur-sm shadow-2xl space-y-6">
          <div>
            <div className="h-4 w-16 bg-muted-foreground/20 rounded-sm mb-2" />
            <div className="h-10 w-full bg-background/50 rounded-lg" />
          </div>
          <div>
            <div className="h-4 w-16 bg-muted-foreground/20 rounded-sm mb-2" />
            <div className="h-10 w-full bg-background/50 rounded-lg" />
          </div>
          <div>
            <div className="h-4 w-24 bg-muted-foreground/20 rounded-sm mb-2" />
            <div className="h-32 w-full bg-background/50 rounded-lg" />
          </div>
          <div className="h-10 w-full bg-accent/10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
