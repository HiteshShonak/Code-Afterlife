import type { Metadata } from 'next';
import { ContactForm } from '@/components/ContactForm';
import { Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us | Code Afterlife',
  description: 'Reach out to the gravediggers. Bug reports, feature requests, or appreciations.',
};

export default function ContactPage() {
  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden selection:bg-accent/30 selection:text-accent py-24">
      
      {/* Background ambient glows */}
      <div className="absolute top-[10%] right-[-5%] h-100 w-100 rounded-full bg-accent/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] h-125 w-125 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-3xl px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in-up">
          <Mail className="mx-auto h-10 w-10 text-accent mb-6" />
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Contact the Graveyard
          </h1>
          <p className="font-mono text-muted-foreground/80 leading-relaxed max-w-xl mx-auto">
            Whether you found a bug haunting the servers or just want to leave a tribute, we are listening.
          </p>
        </div>

        <div className="rounded-2xl border border-border/30 bg-card/20 p-6 sm:p-10 backdrop-blur-sm shadow-2xl">
          <ContactForm />
        </div>
      </div>
      
    </div>
  );
}
