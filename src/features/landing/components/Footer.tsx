"use client";

export function Footer() {
  return (
    <footer className="border-t border-border/10 px-6 py-16 md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 font-mono text-[10.5px] uppercase tracking-[0.35em] md:flex-row">
        
        {/* brand */}
        <span className="text-foreground/60 transition-colors duration-500 hover:text-foreground/90 cursor-default">
          Code Afterlife
        </span>

        {/* philosophy */}
        <span className="text-foreground/30">
          Coded to endure.
        </span>

        {/* links */}
        <div className="flex items-center gap-8">
          <a 
            href="https://github.com/HiteshShonak/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-foreground/50 transition-colors duration-500 hover:text-foreground"
          >
            GitHub
          </a>
        </div>

      </div>
    </footer>
  );
}