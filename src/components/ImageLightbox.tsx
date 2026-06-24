'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
  images: string[];
  startIndex: number;
  projectTitle: string;
  projectSlug: string;
  onClose: () => void;
}

// shared lightbox used on explore feed and project detail page
export function ImageLightbox({
  images,
  startIndex,
  projectTitle,
  projectSlug,
  onClose,
}: ImageLightboxProps) {
  const [current, setCurrent] = useState(startIndex);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [prev, next, onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-9999 flex flex-col bg-black/96 backdrop-blur-xl"
      onClick={onClose}
    >
      {/* toolbar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <h3 className="font-mono text-sm font-bold text-white/90 truncate max-w-[200px]">{projectTitle}</h3>
          {images.length > 1 && (
            <span className="font-mono text-xs text-white/30">{current + 1} / {images.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/project/${projectSlug}`}
            className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 font-mono text-xs font-semibold text-white/90 hover:bg-white/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Project
          </Link>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* main image */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img
            key={current}
            src={images[current]}
            alt={`${projectTitle} screenshot ${current + 1}`}
            initial={{ opacity: 0, x: 60, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
            className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
            style={{ maxHeight: 'calc(100vh - 140px)' }}
          />
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 backdrop-blur-sm text-white/90 hover:bg-black/80 transition-all hover:scale-105"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 backdrop-blur-sm text-white/90 hover:bg-black/80 transition-all hover:scale-105"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* thumbnail strip - shown when 2+ images */}
      {images.length > 1 && (
        <div
          className="flex items-center justify-center gap-2 py-3 px-4"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'relative h-12 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-all duration-200',
                i === current
                  ? 'border-white/80 shadow-[0_0_10px_rgba(255,255,255,0.3)] scale-105'
                  : 'border-white/20 opacity-50 hover:opacity-80'
              )}
            >
              <img src={src} alt={`thumbnail ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
