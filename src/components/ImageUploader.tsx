'use client';

import { useRef, useCallback, memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, AlertCircle, CheckCircle, Loader2, ImagePlus, Sparkles, TriangleAlert } from 'lucide-react';
import { useImageUpload } from '@/hooks/use-image-upload';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Dialog } from '@/components/ui/Dialog';

const WARN_SIZE_MB = 5;

interface ImageUploaderProps {
  onChange:   (urls: string[]) => void;
  required?:  boolean;
  error?:     string;
  maxImages?: number;
  initialImages?: string[];
}

export const ImageUploader = memo(function ImageUploader({
  onChange, required, error, maxImages = 5, initialImages = [],
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rejectedFiles, setRejectedFiles] = useState<{name: string, reason: string}[]>([]);
  const {
    images, addFiles, removeImage,
    isAnyBusy, canAddMore,
  } = useImageUpload(maxImages, initialImages);

  const handleAdd = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files);
      const rejected: {name: string, reason: string}[] = [];
      const validFiles:  File[] = [];

      for (const f of fileArr) {
        if (!f.type.startsWith('image/')) {
          rejected.push({ name: f.name, reason: 'Not an image file' });
          continue;
        }
        if (f.size > WARN_SIZE_MB * 1024 * 1024) {
          rejected.push({ name: f.name, reason: `Exceeds ${WARN_SIZE_MB}MB limit` });
          continue;
        }
        validFiles.push(f);
      }

      if (rejected.length > 0) setRejectedFiles(rejected);
      if (validFiles.length > 0) {
        await addFiles(validFiles);
      }
    },
    [addFiles]
  );

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
      <Dialog
        open={rejectedFiles.length > 0}
        onClose={() => setRejectedFiles([])}
        title="Files Skipped"
        description="The following files were not added:"
      >
        <ul className="mb-4 flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
          {rejectedFiles.map((file, i) => (
            <li key={i} className="flex flex-col gap-0.5">
              <div className="flex items-start gap-1.5 font-mono text-[11px] text-amber-400">
                <TriangleAlert className="mt-[2px] h-3 w-3 shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
              <span className="pl-[18px] font-mono text-[9px] text-muted-foreground/70">
                {file.reason}
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setRejectedFiles([])}
          className="w-full rounded border border-border/50 bg-secondary/60 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-foreground hover:bg-secondary transition-colors"
        >
          Got it
        </button>
      </Dialog>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Screenshots {required && <span className="ml-1 text-accent">*</span>}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/50">
          {images.length}/{maxImages}
        </span>
      </div>

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
                <Image
                  src={img.preview}
                  alt={img.name}
                  fill
                  className="object-cover"
                  unoptimized
                />

                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-sm bg-accent px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-background">
                    Cover
                  </span>
                )}


                {img.status === 'compressing' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/65">
                    <Sparkles className="h-5 w-5 animate-pulse text-amber-400" />
                    <p className="font-mono text-[9px] text-amber-300">Compressing…</p>
                  </div>
                )}

                {img.status === 'uploading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/55">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                    <p className="font-mono text-[9px] text-white/70">Uploading…</p>
                  </div>
                )}

                {img.status === 'done' && (
                  <div className="absolute bottom-1 right-1">
                    <CheckCircle className="h-4 w-4 text-green-400 drop-shadow-sm" />
                  </div>
                )}

                {img.status === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/70">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <p className="px-2 text-center font-mono text-[8px] text-destructive leading-tight">
                      {img.error ?? 'Upload failed'}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-destructive sm:hidden sm:group-hover:flex"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

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

      {error && (
        <p className="flex items-center gap-1.5 font-mono text-[10px] text-destructive">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}

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
