'use client';

import { useState } from 'react';
import { Send, Bug, Heart, Lightbulb, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

type ContactType = 'BUG' | 'APPRECIATION' | 'FEATURE' | 'OTHER';

const CONTACT_TYPES = [
  { id: 'BUG', label: 'Bug Report', icon: Bug, color: 'text-destructive' },
  { id: 'FEATURE', label: 'Feature Request', icon: Lightbulb, color: 'text-amber-400' },
  { id: 'APPRECIATION', label: 'Appreciation', icon: Heart, color: 'text-emerald-400' },
  { id: 'OTHER', label: 'Other', icon: MessageSquare, color: 'text-accent' },
] as const;

export function ContactForm() {
  const [selectedType, setSelectedType] = useState<ContactType>('BUG');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('LOADING');
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 1000));
    setStatus('SUCCESS');
    setMessage('');
    setEmail('');
  };

  if (status === 'SUCCESS') {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-12 text-center animate-fade-in-up backdrop-blur-md">
        <Heart className="mx-auto h-12 w-12 text-emerald-400 mb-4 animate-pulse" />
        <h3 className="font-mono text-xl font-bold text-emerald-50 mb-2">Message Received</h3>
        <p className="font-sans text-emerald-200/70 mb-6">
          Thank you for reaching out to the afterlife. We will review your message shortly.
        </p>
        <button
          onClick={() => setStatus('IDLE')}
          className="rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-6 py-2 font-mono text-sm text-emerald-100 transition-colors hover:bg-emerald-500/30"
        >
          Send Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
      
      {/* Type Selector */}
      <div className="space-y-3">
        <label className="font-mono text-sm font-bold text-muted-foreground uppercase tracking-wider">
          What is this regarding?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CONTACT_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type.id as ContactType)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all duration-300",
                  isSelected 
                    ? "border-foreground bg-card/60 shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                    : "border-border/40 bg-black/20 hover:border-border hover:bg-black/40 text-muted-foreground/60"
                )}
              >
                <Icon className={cn("h-6 w-6 transition-colors duration-300", isSelected ? type.color : "")} />
                <span className={cn("font-mono text-[11px] font-semibold", isSelected ? "text-foreground" : "")}>
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="font-mono text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Email Address (Optional)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border/50 bg-black/40 px-4 py-3 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/20 placeholder:text-muted-foreground/30"
            placeholder="ghost@example.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="font-mono text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Your Message
          </label>
          <textarea
            id="message"
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full resize-none rounded-xl border border-border/50 bg-black/40 px-4 py-3 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/20 placeholder:text-muted-foreground/30"
            placeholder="Tell us what's on your mind..."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'LOADING' || !message.trim()}
        className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3.5 font-mono text-sm font-bold text-background transition-all hover:bg-foreground/90 disabled:opacity-50 overflow-hidden"
      >
        <span className="relative z-10 flex items-center gap-2">
          {status === 'LOADING' ? (
            'Transmitting...'
          ) : (
            <>
              Send Transmission <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </span>
      </button>

    </form>
  );
}
