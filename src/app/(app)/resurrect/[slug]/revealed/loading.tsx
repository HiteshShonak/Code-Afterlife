import { ShieldAlert } from 'lucide-react';

export default function TestamentRevealedLoading() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden animate-pulse">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.03)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-2xl w-full text-center relative z-10">
        <ShieldAlert className="h-12 w-12 text-amber-500/20 mx-auto mb-6" />
        <div className="h-6 w-64 bg-amber-500/10 rounded-sm mx-auto mb-12" />

        <div className="min-h-[200px]">
          <div className="relative rounded-2xl border border-amber-500/10 bg-amber-500/[0.02] p-8 shadow-2xl h-48 w-full" />
        </div>

        <div className="mt-12 flex justify-center">
          <div className="h-12 w-48 bg-amber-500/10 rounded-md" />
        </div>
      </div>
    </div>
  );
}
