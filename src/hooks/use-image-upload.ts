'use client';

import { useState, useCallback } from 'react';
import { compressToWebP, formatFileSize } from '@/lib/compress-image';

export type UploadStatus = 'idle' | 'compressing' | 'uploading' | 'done' | 'error';

export interface UploadedImage {
  // url
  url:           string;
  // public id
  publicId:      string;
  // preview
  preview:       string;
  // name
  name:          string;
  status:        UploadStatus;
  // size
  originalSize?: number;
  // comp size
  compressedSize?: number;
  error?:        string;
}

// pre validate limits
const MAX_RAW_SIZE_MB = 20;           // 20MB raw input is the absolute ceiling
const ALLOWED_TYPES   = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// upload to cloudinary
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

// cleanup orphans
async function cleanupOrphans(publicIds: string[]): Promise<void> {
  if (!publicIds.length) return;
  try {
    await fetch('/api/upload/cleanup', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ publicIds }),
    });
  } catch {
    // silent fail
  }
}

// image upload hook
export function useImageUpload(maxImages = 5) {
  const [images, setImages] = useState<UploadedImage[]>([]);

  const updateImage = useCallback((index: number, patch: Partial<UploadedImage>) => {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  }, []);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);

    // pre validation
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
      // show error toast
      alert(errors.join('\n'));
    }

    // slot limit
    const slots     = maxImages - images.length;
    const toProcess = valid.slice(0, slots);
    if (!toProcess.length) return;

    // register pending
    const pending: UploadedImage[] = toProcess.map((file) => ({
      url:          '',
      publicId:     '',
      preview:      URL.createObjectURL(file), // temp preview
      name:         file.name,
      originalSize: file.size,
      status:       'compressing' as const,
    }));

    setImages((prev) => [...prev, ...pending]);
    const startIndex = images.length;

    // parallel upload
    await Promise.all(
      toProcess.map(async (rawFile, i) => {
        const idx = startIndex + i;

        try {
          // compress
          const compressed = await compressToWebP(rawFile);

          // set preview
          const compressedPreview = URL.createObjectURL(compressed);
          updateImage(idx, {
            preview:        compressedPreview,
            compressedSize: compressed.size,
            name:           compressed.name,
            status:         'uploading',
          });

          // upload
          const { url, publicId } = await uploadToCloudinary(compressed);

          // revoke raw preview
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

  // delete on fail
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
