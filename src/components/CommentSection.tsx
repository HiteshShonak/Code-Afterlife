'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, MessageSquare, Pin } from 'lucide-react';
import Image from 'next/image';
import { formatRelativeDate } from '@/lib/utils';
import type { CommentWithUser } from '@/services/social.service';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

// Extend CommentWithUser to include isPinned
type CommentWithPinned = CommentWithUser & { isPinned?: boolean };

interface CommentSectionProps {
  projectId:       string;
  initialComments: CommentWithUser[];
  nextCursor:      string | null;
  currentUserId:   string | null;
  isLoggedIn:      boolean;
  isProjectOwner?: boolean;
}

const MAX_CHARS = 500;

/* ─────────────── Comment Entry ─────────────────────────────────────────── */

function CommentEntry({
  comment,
  currentUserId,
  isProjectOwner,
  onDeleteRequest,
  onPinToggle,
}: {
  comment:       CommentWithUser & { isPinned?: boolean };
  currentUserId: string | null;
  isProjectOwner?: boolean;
  onDeleteRequest: (id: string) => void;
  onPinToggle: (id: string, isPinned: boolean) => void;
}) {
  const isCommentOwner = currentUserId === comment.userId;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 py-4 ${comment.isPinned ? 'border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 mb-2' : ''}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {comment.user.image ? (
          <Image
            src={comment.user.image}
            alt={comment.user.username ?? comment.user.name ?? 'User'}
            width={32}
            height={32}
            className="rounded-full ring-1 ring-border"
            sizes="32px"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 font-mono text-[11px] font-bold text-accent ring-1 ring-border">
            {(comment.user.username ?? comment.user.name ?? '?')[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] font-semibold text-foreground/90">
            @{comment.user.username ?? comment.user.name ?? 'unknown'}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/40">
            {formatRelativeDate(new Date(comment.createdAt))}
          </span>
          {comment.isPinned && (
            <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded ml-2">
              <Pin className="h-3 w-3" />
              PINNED
            </span>
          )}
        </div>
        <p className="font-mono text-[12px] leading-relaxed text-muted-foreground/80 break-words">
          {comment.content}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 flex-shrink-0 self-start">
        {isProjectOwner && (
          <button
            onClick={() => onPinToggle(comment.id, !!comment.isPinned)}
            className={`p-1 transition-colors ${comment.isPinned ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground/30 hover:text-amber-500/70'}`}
            title={comment.isPinned ? "Unpin comment" : "Pin comment"}
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
        )}
        {isCommentOwner && (
          <button
            onClick={() => onDeleteRequest(comment.id)}
            className="p-1 text-muted-foreground/30 transition-colors hover:text-destructive/70"
            aria-label="Delete comment"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </motion.li>
  );
}

/* ─────────────── Comment Form ───────────────────────────────────────────── */

function CommentForm({
  projectId,
  isLoggedIn,
  onPosted,
}: {
  projectId: string;
  isLoggedIn: boolean;
  onPosted: (comment: CommentWithUser) => void;
}) {
  const [content, setContent]   = useState('');
  const [posting, setPosting]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const textareaRef             = useRef<HTMLTextAreaElement>(null);

  const charsLeft = MAX_CHARS - content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || posting || charsLeft < 0) return;
    if (!isLoggedIn) { window.location.assign('/'); return; }

    setPosting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: content.trim() }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message ?? 'Failed to post comment');
      }
      const json = await res.json();
      onPosted(json.data);
      setContent('');
      textareaRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/40 px-5 py-4 text-center">
        <p className="font-mono text-[12px] text-muted-foreground/60">
          <a href="/" className="text-accent/70 underline-offset-2 hover:underline">Sign in with GitHub</a>
          {' '}to join the conversation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); setError(null); }}
          placeholder="Share your thoughts on this project..."
          rows={3}
          maxLength={MAX_CHARS}
          className={[
            'w-full resize-none rounded-xl border bg-card/60 px-4 py-3 font-mono text-[12px] text-foreground outline-none placeholder:text-muted-foreground/40 transition-all',
            charsLeft < 50
              ? 'border-amber-500/40 focus:border-amber-500/60'
              : 'border-border/60 focus:border-accent/40 focus:ring-1 focus:ring-accent/20',
          ].join(' ')}
        />
        <span
          className={[
            'absolute bottom-2.5 right-3 font-mono text-[10px] select-none',
            charsLeft < 0
              ? 'text-destructive'
              : charsLeft < 50
              ? 'text-amber-400/70'
              : 'text-muted-foreground/30',
          ].join(' ')}
        >
          {charsLeft}
        </span>
      </div>

      {error && (
        <p className="font-mono text-[11px] text-destructive">{error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={posting || !content.trim() || charsLeft < 0}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 font-mono text-[12px] font-semibold text-background transition-all hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
          {posting ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  );
}

/* ─────────────── Main Component ─────────────────────────────────────────── */

export function CommentSection({
  projectId,
  initialComments,
  nextCursor:    initialCursor,
  currentUserId,
  isLoggedIn,
  isProjectOwner,
}: CommentSectionProps) {
  const [comments, setComments]   = useState<CommentWithPinned[]>(initialComments);
  const [cursor, setCursor]       = useState<string | null>(initialCursor);
  const [loading, setLoading]     = useState(false);
  
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting]           = useState(false);
  const [deleteError, setDeleteError]         = useState<string | null>(null);

  const handlePosted = useCallback((comment: CommentWithUser) => {
    setComments((prev) => [comment, ...prev]);
  }, []);

  const togglePin = useCallback(async (commentId: string, isCurrentlyPinned: boolean) => {
    // Optimistic UI update
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, isPinned: !isCurrentlyPinned } : c));
    
    try {
      const res = await fetch(`/api/projects/${projectId}/comments/${commentId}/pin`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to pin comment');
    } catch {
      // Revert on error
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, isPinned: isCurrentlyPinned } : c));
    }
  }, [projectId]);

  const confirmDelete = useCallback(async () => {
    if (!commentToDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/comments/${commentToDelete}`,
        { method: 'DELETE' },
      );
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentToDelete));
        setCommentToDelete(null);
      } else {
        setDeleteError('Failed to delete comment. Please try again.');
      }
    } catch {
      setDeleteError('Network error. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [commentToDelete, isDeleting, projectId]);

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/comments?cursor=${cursor}`);
      const json = await res.json();
      setComments((prev) => [...prev, ...json.data.comments]);
      setCursor(json.data.nextCursor);
    } finally {
      setLoading(false);
    }
  };

  const sortedComments = useMemo(() => [...comments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }), [comments]);

  return (
    <div className="space-y-6">
      {/* Form */}
      <CommentForm projectId={projectId} isLoggedIn={isLoggedIn} onPosted={handlePosted} />

      {/* List */}
      {comments.length === 0 ? (
        <div className="py-10 text-center">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground/20" />
          <p className="font-mono text-[12px] text-muted-foreground/40">
            No comments yet. Be the first to share your thoughts.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border/40">
            <AnimatePresence mode="popLayout">
              {sortedComments.map((c) => (
                <CommentEntry
                  key={c.id}
                  comment={c as any}
                  currentUserId={currentUserId}
                  isProjectOwner={isProjectOwner}
                  onDeleteRequest={setCommentToDelete}
                  onPinToggle={togglePin}
                />
              ))}
            </AnimatePresence>
          </ul>

          {/* Load more */}
          {cursor && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full rounded-xl border border-border/50 py-2.5 font-mono text-[11px] text-muted-foreground/60 transition-colors hover:border-border hover:text-muted-foreground disabled:opacity-40"
            >
              {loading ? 'Loading…' : 'Load more comments'}
            </button>
          )}
        </>
      )}

      {/* Deletion Modal */}
      <Dialog
        open={!!commentToDelete}
        onClose={() => {
          if (!isDeleting) { setCommentToDelete(null); setDeleteError(null); }
        }}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
      >
        {deleteError && (
          <p className="mb-4 font-mono text-[11px] text-destructive">{deleteError}</p>
        )}
        <div className="flex justify-end gap-3 mt-2">
          <Button variant="ghost" onClick={() => { setCommentToDelete(null); setDeleteError(null); }} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
            isLoading={isDeleting}
            className="w-auto px-6 h-9"
          >
            {isDeleting ? 'Deleting...' : 'Delete Comment'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

