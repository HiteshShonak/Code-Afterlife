'use client';

import { useState, useCallback } from 'react';
import { compressToWebP, formatFileSize } from '@/lib/compress-image';

export type UploadStatus = 'idle' | 'compressing' | 'uploading' | 'done' | 'error';

export interface UploadedImage {
  /** Cloudinary delivery URL for display */
  url:           string;
  /** Cloudinary public_id — needed for orphan cleanup */
  publicId:      string;
  /** Local preview ObjectURL pointing at the compressed WebP blob */
  preview:       string;
  /** Original filename (pre-compression) */
  name:          string;
  status:        UploadStatus;
  /** Original file size before compression */
  originalSize?: number;
  /** Compressed file size (WebP) — shown in UI for feedback */
  compressedSize?: number;
  error?:        string;
}

// Pre-validation limits (applied BEFORE compression)
const MAX_RAW_SIZE_MB = 20;           // 20MB raw input is the absolute ceiling
const ALLOWED_TYPES   = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Upload a single (already-compressed) file to Cloudinary via signed upload.
 * Gets a fresh signature from our API before each upload.
 */
async function uploadToCloudinary(file: File): Promise<{ url: string; publicId: string }> {
  const sigRes = await fetch('/api/upload/sign');
  if (!sigRes.ok) throw new Error('Failed to get upload signature');

  const { signature, timestamp, cloudName, apiKey, folder } = await sigRes.json();

  const formData = new FormData();
  formData.append('file',      file);
  formData.append('signature', signature);
  formData.append('timestamp', String(timestamp));
  formData.append('api_key',   apiKey);
  formData.append('folder',    folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } })?.error?.message ?? 'Upload failed');
  }

  const data = await uploadRes.json() as { secure_url: string; public_id: string };
  return { url: data.secure_url, publicId: data.public_id };
}

/**
 * Fire-and-forget orphan cleanup.
 * Deletes Cloudinary images when project creation fails after upload.
 */
async function cleanupOrphans(publicIds: string[]): Promise<void> {
  if (!publicIds.length) return;
  try {
    await fetch('/api/upload/cleanup', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ publicIds }),
    });
  } catch {
    // Fail silently — orphan cleanup must never block the user
  }
}

/**
 * Manages up to N image uploads for the create project modal.
 *
 * Pipeline per file:
 *   1. Validate type + raw size
 *   2. Compress to WebP locally (Canvas API, 1440×1080 max, quality 0.82)
 *   3. Show compressed preview
 *   4. Upload compressed WebP directly to Cloudinary
 *   5. Store returned URL + publicId
 *
 * Provides cleanup() for orphan deletion on project creation failure.
 */
export function useImageUpload(maxImages = 5) {
  const [images, setImages] = useState<UploadedImage[]>([]);

  const updateImage = useCallback((index: number, patch: Partial<UploadedImage>) => {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  }, []);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);

    // ── 1. Pre-validation (type + raw size) ──
    const valid: File[]   = [];
    const errors: string[] = [];

    for (const file of fileArr) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: unsupported format. Use JPG, PNG, WebP, or GIF.`);
        continue;
      }
      if (file.size > MAX_RAW_SIZE_MB * 1024 * 1024) {
        errors.push(`${file.name}: too large (max ${MAX_RAW_SIZE_MB}MB raw).`);
        continue;
      }
      valid.push(file);
    }

    if (errors.length) {
      // Non-blocking: surface first error as a toast-style alert
      // (could be swapped for a proper toast system in Phase 2B)
      alert(errors.join('\n'));
    }

    // Respect slot limit
    const slots     = maxImages - images.length;
    const toProcess = valid.slice(0, slots);
    if (!toProcess.length) return;

    // ── 2. Register pending entries immediately (triggers progress UI) ──
    const pending: UploadedImage[] = toProcess.map((file) => ({
      url:          '',
      publicId:     '',
      preview:      URL.createObjectURL(file), // replaced with WebP preview after compression
      name:         file.name,
      originalSize: file.size,
      status:       'compressing' as const,
    }));

    setImages((prev) => [...prev, ...pending]);
    const startIndex = images.length;

    // ── 3. Compress + upload each file in parallel ──
    await Promise.all(
      toProcess.map(async (rawFile, i) => {
        const idx = startIndex + i;

        try {
          // ── Compression ──
          const compressed = await compressToWebP(rawFile);

          // Update preview to the compressed WebP blob
          const compressedPreview = URL.createObjectURL(compressed);
          updateImage(idx, {
            preview:        compressedPreview,
            compressedSize: compressed.size,
            name:           compressed.name,
            status:         'uploading',
          });

          // ── Upload ──
          const { url, publicId } = await uploadToCloudinary(compressed);

          // Revoke the old raw preview now that we have the Cloudinary URL
          // (the compressed preview stays until the modal is closed)
          updateImage(idx, { url, publicId, status: 'done' });

        } catch (err) {
          updateImage(idx, {
            status: 'error',
            error:  err instanceof Error ? err.message : 'Upload failed',
          });
        }
      })
    );
  }, [images, maxImages, updateImage]);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const img = prev[index];
      if (img?.preview) URL.revokeObjectURL(img.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const reset = useCallback(() => {
    setImages((prev) => {
      prev.forEach((img) => { if (img.preview) URL.revokeObjectURL(img.preview); });
      return [];
    });
  }, []);

  /** Delete all uploaded images from Cloudinary. Call when project creation fails. */
  const cleanup = useCallback(async () => {
    const publicIds = images
      .filter((img) => img.status === 'done' && img.publicId)
      .map((img) => img.publicId);
    await cleanupOrphans(publicIds);
    reset();
  }, [images, reset]);

  const uploadedUrls   = images.filter((i) => i.status === 'done').map((i) => i.url);
  const isAnyBusy      = images.some((i) => i.status === 'compressing' || i.status === 'uploading');
  const hasError       = images.some((i) => i.status === 'error');
  const canAddMore     = images.length < maxImages;

  return {
    images,
    addFiles,
    removeImage,
    reset,
    cleanup,
    uploadedUrls,
    isAnyBusy,
    hasError,
    canAddMore,
    maxImages,
    formatFileSize,
  };
}
