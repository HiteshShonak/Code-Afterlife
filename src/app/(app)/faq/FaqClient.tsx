'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Zap, Skull, ArrowUpFromLine, Heart, Activity } from 'lucide-react';

const FAQ_ITEMS = [
  {
    icon: Activity,
    color: 'text-accent',
    q: 'What is Code Afterlife?',
    a: `Code Afterlife is a platform for tracking the true lifecycle of software projects. Every project is born, grows, stalls, ships - or dies. Unlike GitHub which only shows you activity, Code Afterlife shows you the emotional arc of a project: its health, its decay, its potential for resurrection. Software never truly dies - it waits for someone to believe in it again.`,
  },
  {
    icon: Activity,
    color: 'text-emerald-400',
    q: 'What are project states?',
    a: `Every project exists in one of five states:\n\n• BORN - Just registered, fresh and full of potential (health: 50)\n• ACTIVE - Showing regular commit activity and momentum\n• STALLED - No commits for 30+ consecutive days - the project is fading\n• SHIPPED - Successfully completed and deployed\n• DEAD - No activity for 90+ days - waiting in the graveyard for a revival`,
  },
  {
    icon: Heart,
    color: 'text-rose-400',
    q: 'How is project health calculated?',
    a: `Health is a score from 0–100 calculated using three factors:\n\n• Activity Score (40%) - commit frequency over the past 30 days\n• Consistency Score (30%) - how recently the project was active\n• Momentum Score (30%) - whether velocity is increasing or decreasing\n\nHealth decays naturally over time without activity. A healthy project glows. A dying one fades to grayscale.`,
  },
  {
    icon: Skull,
    color: 'text-red-400',
    q: 'What happens when a project dies?',
    a: `When a project reaches DEAD status (no activity for 90+ days), it enters The Graveyard. It loses its color, its animations slow to stillness, and a tombstone appears in the graveyard feed.\n\nBut death is not the end. Any developer can discover a dead project and choose to resurrect it - creating a new chapter in its lineage.`,
  },
  {
    icon: ArrowUpFromLine,
    color: 'text-blue-400',
    q: 'What is the Revival / Resurrection system?',
    a: `The Revival system is Code Afterlife's core differentiator. When someone resurrects a dead project:\n\n1. A new project is created with BORN state\n2. It's linked to the original via parentProjectId\n3. The lineage depth increases by 1\n4. Both the original creator and new developer are credited\n\nThis creates a lineage graph - a visual family tree of ideas that refused to die.`,
  },
  {
    icon: Zap,
    color: 'text-amber-400',
    q: 'What is the Trending algorithm?',
    a: `Trending score is calculated using a Hacker News-style time-decay formula:\n\ntrendingScore = ((likes × 3) + (comments × 2) + (votes × 1) + (health × 0.5)) ÷ (ageInHours + 2)^1.5\n\nRecent engagement matters more than old engagement. A project that got 10 likes today outranks one that got 100 likes last month.`,
  },
  {
    icon: Heart,
    color: 'text-purple-400',
    q: 'How do I add screenshots to my project?',
    a: `During project creation (or via the edit flow), you can upload 1–5 screenshots. Images are automatically compressed to WebP format in your browser before uploading to Cloudinary to save space. The first screenshot is required - it's shown as the project's cover image in cards and feeds.`,
  },
  {
    icon: Activity,
    color: 'text-teal-400',
    q: 'Is Code Afterlife free?',
    a: `Yes, completely free. The entire platform runs on free-tier infrastructure:\n\n• Hosting: Vercel (free)\n• Database: Neon PostgreSQL (free 0.5GB)\n• File Storage: Cloudinary (free 25GB)\n• Auth: GitHub OAuth (free)\n\nCode Afterlife is built with the philosophy that great developer tools don't need to cost anything.`,
  },
];

function FaqItem({ item, index }: { item: typeof FAQ_ITEMS[number]; index: number }) {
  const [open, setOpen] = useState(false);
  const Icon = item.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-white/6 bg-card/60 backdrop-blur-sm overflow-hidden"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-white/3"
        aria-expanded={open}
      >
        <Icon className={['h-4 w-4 shrink-0', item.color].join(' ')} />
        <span className="flex-1 font-mono text-[13px] font-semibold text-foreground">
          {item.q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 px-6 pb-6 pt-4">
              <p className="font-mono text-[12px] leading-relaxed text-muted-foreground whitespace-pre-line">
                {item.a}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FaqClient() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-32 pt-10 md:px-10">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12"
      >
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground/60">
          Code Afterlife · FAQ
        </p>
        <h1 className="font-mono text-3xl font-extrabold tracking-tight text-foreground">
          Frequently Asked{' '}
          <span className="text-accent">Questions</span>
        </h1>
        <p className="mt-3 font-mono text-[13px] text-muted-foreground/70 max-w-xl">
          Everything you need to know about the platform where software never truly dies.
        </p>
      </motion.div>

      {/* FAQ list */}
      <div className="space-y-3">
        {FAQ_ITEMS.map((item, i) => (
          <FaqItem key={i} item={item} index={i} />
        ))}
      </div>

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-16 rounded-2xl border border-accent/20 bg-accent/4 p-8 text-center"
      >
        <p className="font-mono text-[13px] font-semibold text-foreground mb-1">
          Still have questions?
        </p>
        <p className="font-mono text-[11px] text-muted-foreground/60">
          Explore the platform, check out other projects, or register your first project to see the lifecycle in action.
        </p>
      </motion.div>
    </div>
  );
}
