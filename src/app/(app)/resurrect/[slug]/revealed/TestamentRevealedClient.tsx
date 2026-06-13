'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, Terminal } from 'lucide-react';

interface TestamentRevealedClientProps {
  slug: string;
  testament: string | null;
  parentTitle?: string;
}

export function TestamentRevealedClient({ slug, testament, parentTitle }: TestamentRevealedClientProps) {
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Cinematic delay
    const timer1 = setTimeout(() => setShowContent(true), 1500);
    const timer2 = setTimeout(() => setShowButton(true), 4000);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.03)_0%,transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="max-w-2xl w-full text-center relative z-10"
      >
        <ShieldAlert className="h-12 w-12 text-amber-500/50 mx-auto mb-6" />
        <h1 className="font-mono text-xl uppercase tracking-[0.3em] text-amber-500/80 mb-12">
          Testament Unsealed
        </h1>

        <div className="min-h-[200px]">
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="relative rounded-2xl border border-amber-500/10 bg-amber-500/[0.02] p-8 backdrop-blur-sm text-left shadow-2xl"
              >
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-amber-500/50 to-transparent rounded-l-2xl" />
                <div className="flex items-center gap-2 mb-4 text-muted-foreground/50 font-mono text-xs">
                  <Terminal className="h-4 w-4" />
                  <span>Legacy of {parentTitle}</span>
                </div>
                
                {testament ? (
                  <p className="whitespace-pre-wrap font-sans text-lg leading-relaxed text-foreground/90 font-light italic">
                    "{testament}"
                  </p>
                ) : (
                  <div className="space-y-4">
                    <p className="font-mono text-sm text-muted-foreground/60 italic">
                      No testament was left behind...
                    </p>
                    <p className="font-sans text-base leading-relaxed text-foreground/80">
                      Do whatever you want, because anyway, a Will & Testament is just a request. The code is yours now.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showButton && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="mt-12"
            >
              <Button
                onClick={() => router.push(`/project/${slug}`)}
                className="bg-amber-500/20 text-amber-500 border border-amber-500/30 hover:bg-amber-500/30 px-8 h-12 text-sm uppercase tracking-widest font-mono"
              >
                Assume Control
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
