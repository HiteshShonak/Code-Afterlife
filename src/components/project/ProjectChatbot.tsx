'use client';

import { Bot, Send, User, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ProjectChatbotProps {
  projectId: string;
  isLoggedIn: boolean;
}

export function ProjectChatbot({ projectId, isLoggedIn }: ProjectChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      role: 'assistant',
      content: "I'm Code Afterlife AI. I've read this project's history, health, and timeline. Ask me anything about it!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Keep a stable ref to messages so sendMessage never captures a stale snapshot
  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    setError(null);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text
    };

    // Append user message immediately — use functional updater to get current state
    let snapshot: Message[] = [];
    setMessages(prev => {
      snapshot = [...prev, userMessage];
      return snapshot;
    });
    setIsLoading(true);

    // Placeholder for assistant
    const assistantId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Use messagesRef (via snapshot) so we always have the freshest history
          messages: [...messagesRef.current, userMessage].map(m => ({ role: m.role, content: m.content }))
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to get response');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, content: accumulated } : m
          )
        );
      }

      // If accumulated is empty (e.g. AI SDK streaming protocol), 
      // try to parse as event-stream
      if (!accumulated) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: 'I encountered an issue generating a response. Please try again.' }
              : m
          )
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: `Error: ${errorMessage}` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      // Refocus input
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, isLoading, projectId]);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-[420px] rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-8 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--accent-rgb,245,158,11),0.08)_0%,transparent_65%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="h-14 w-14 mb-5 rounded-full border border-accent/30 bg-accent/5 flex items-center justify-center">
            <Bot className="h-7 w-7 text-accent/60" />
          </div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/80 mb-2 font-bold">
            Code Afterlife AI
          </h3>
          <p className="font-mono text-[11px] text-muted-foreground/50 max-w-[280px] mb-6 leading-relaxed">
            The AI has analyzed this project's history and architecture. Sign in to unlock the conversation.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-accent/15 border border-accent/30 px-5 py-2.5 font-mono text-[10px] font-bold tracking-widest text-accent transition-all hover:bg-accent/25 hover:scale-[1.02] uppercase"
          >
            Sign In to Chat
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[420px] rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/50 bg-card/60 px-4 py-3 flex-shrink-0">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 border border-accent/20 text-accent">
          <Bot className="h-4 w-4" />
          {/* Online indicator */}
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-background" />
        </div>
        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-widest text-foreground/90 font-bold leading-none">
            Code Afterlife AI
          </h3>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {isLoading && (
            <Loader2 className="h-3.5 w-3.5 text-accent/60 animate-spin" />
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-[11px] md:text-[12px]">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="flex-shrink-0 h-6 w-6 mt-0.5 rounded-full bg-accent/15 flex items-center justify-center border border-accent/25 text-accent">
                <Bot className="h-3 w-3" />
              </div>
            )}
            <div className={[
              'max-w-[80%] rounded-xl px-3.5 py-2.5 leading-relaxed break-words whitespace-pre-wrap',
              m.role === 'user'
                ? 'bg-accent text-background rounded-tr-sm'
                : 'bg-card/80 border border-border/50 text-foreground/80 rounded-tl-sm',
              m.content === '' && m.role === 'assistant' ? 'min-w-[60px]' : ''
            ].join(' ')}>
              {m.content === '' && m.role === 'assistant' ? (
                <span className="flex items-center gap-1 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              ) : m.content}
            </div>
            {m.role === 'user' && (
              <div className="flex-shrink-0 h-6 w-6 mt-0.5 rounded-full bg-foreground/10 flex items-center justify-center text-foreground/40 border border-border/50">
                <User className="h-3 w-3" />
              </div>
            )}
          </div>
        ))}
        
        {error && (
          <p className="font-mono text-[10px] text-destructive/80 text-center py-1">
            {error}
          </p>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-card/60 px-3 py-3 flex-shrink-0">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                // Call the core submit logic directly to avoid casting keyboard event
                const form = e.currentTarget.closest('form');
                if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }
            }}
            placeholder="Ask about this project..."
            disabled={isLoading}
            className="flex-1 rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 font-mono text-[12px] outline-none placeholder:text-muted-foreground/30 focus:border-accent/50 focus:bg-background transition-all disabled:opacity-60"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent text-background transition-all hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
