'use client';

import { useRef, useCallback, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, AlertCircle, CheckCircle, Loader2, ImagePlus, Sparkles } from 'lucide-react';
import { useImageUpload } from '@/hooks/use-image-upload';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImageUploaderProps {
  onChange:   (urls: string[]) => void;
  required?:  boolean;
  error?:     string;
  maxImages?: number;
}

/**
 * Drag-and-drop + click image uploader with client-side WebP compression.
 *
 * Pipeline per file:
 *   Compress to WebP (Canvas, 1440×1080) → show local preview → upload to Cloudinary
 *
 * Status overlays:
 *   compressing → uploading → done (green tick + savings badge) | error
 */
export const ImageUploader = memo(function ImageUploader({
  onChange, required, error, maxImages = 5,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    images, addFiles, removeImage,
    isAnyBusy, canAddMore, formatFileSize,
  } = useImageUpload(maxImages);

  const handleAdd = useCallback(
    async (files: FileList | File[]) => { await addFiles(files); },
    [addFiles]
  );

  // Notify parent whenever the done-URL list changes
  const prevUrlsRef = useRef<string>('');
  useEffect(() => {
    const urls = images.filter((i) => i.status === 'done').map((i) => i.url as string);
    const urlsKey = urls.join('|');
    if (prevUrlsRef.current !== urlsKey) {
      prevUrlsRef.current = urlsKey;
      onChange(urls);
    }
  }, [images, onChange]);

  const onDrop     = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) handleAdd(e.dataTransfer.files);
  }, [handleAdd]);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className="flex flex-col gap-3">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Screenshots {required && <span className="ml-1 text-accent">*</span>}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/50">
          {images.length}/{maxImages} · up to 20MB · auto-compressed to WebP
        </span>
      </div>

      {/* Image grid — always occupies the same slot so nothing shifts below */}
      <div className={cn(
        'grid gap-2',
        images.length > 0 ? 'grid-cols-3' : 'hidden'
      )}>
        <AnimatePresence>
          {images.map((img, i) => {
            return (
              <motion.div
                key={img.preview}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.18 }}
                className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-secondary"
              >
                {/* Preview */}
                <Image
                  src={img.preview}
                  alt={img.name}
                  fill
                  className="object-cover"
                  unoptimized
                />

                {/* Cover badge */}
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-sm bg-accent px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-background">
                    Cover
                  </span>
                )}

                {/* ── Status overlays ── */}

                {/* Compressing */}
                {img.status === 'compressing' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/65">
                    <Sparkles className="h-5 w-5 animate-pulse text-amber-400" />
                    <p className="font-mono text-[9px] text-amber-300">Compressing…</p>
                  </div>
                )}

                {/* Uploading */}
                {img.status === 'uploading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/55">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                    <p className="font-mono text-[9px] text-white/70">Uploading…</p>
                  </div>
                )}

                {/* Done — green tick only */}
                {img.status === 'done' && (
                  <div className="absolute bottom-1 right-1">
                    <CheckCircle className="h-4 w-4 text-green-400 drop-shadow-sm" />
                  </div>
                )}

                {/* Error */}
                {img.status === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/70">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <p className="px-2 text-center font-mono text-[8px] text-destructive leading-tight">
                      {img.error ?? 'Upload failed'}
                    </p>
                  </div>
                )}

                {/* Remove button — hover only */}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-destructive group-hover:flex"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Drop zone — fixed height so adding images doesn't shift the modal footer */}
      {canAddMore && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 transition-all',
            error
              ? 'border-destructive/50 bg-destructive/5'
              : 'border-border hover:border-accent/50 hover:bg-accent/5',
          )}
        >
          {images.length === 0 ? (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary">
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-mono text-[12px] text-foreground">
                  Drop images here or{' '}
                  <span className="text-accent underline underline-offset-2">browse</span>
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/60">
                  {required ? 'At least 1 required · ' : ''}Up to {maxImages} images
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Upload className="h-4 w-4" />
              <span className="font-mono text-[11px]">
                Add more ({maxImages - images.length} remaining)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleAdd(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Error */}
      {error && (
        <p className="flex items-center gap-1.5 font-mono text-[10px] text-destructive">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}

      {/* Global busy indicator */}
      {isAnyBusy && (
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {images.some((i) => i.status === 'compressing') && (
              <span className="flex items-center gap-1 font-mono text-[10px] text-amber-400">
                <Sparkles className="h-3 w-3 animate-pulse" /> Compressing
              </span>
            )}
            {images.some((i) => i.status === 'uploading') && (
              <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                {images.some((i) => i.status === 'compressing') ? ' · ' : ''}
                <Loader2 className="h-3 w-3 animate-spin" /> Uploading
              </span>
            )}
          </div>
        </div>
      )}


    </div>
  );
});
