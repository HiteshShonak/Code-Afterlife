/**
 * Client-side image compression utility.
 * Converts any supported image to WebP and resizes to fit within max dimensions.
 * Runs entirely in the browser using the Canvas API — no server round-trip.
 *
 * Strategy:
 *  1. Draw the original image onto a canvas at the target dimensions
 *  2. toBlob() with 'image/webp' + quality (0–1)
 *  3. Fall back to the original file if WebP is unsupported (old Safari)
 *
 * Quality/dimension tuning:
 *  - Screenshots live in a card carousel at ≤960px wide on 2× screens → 1440px max-width is plenty
 *  - quality 0.82 gives ~60-80% size reduction vs PNG with imperceptible quality loss
 */

export interface CompressOptions {
  /** Max width in pixels. Larger images are proportionally scaled down. Default: 1440 */
  maxWidth?:  number;
  /** Max height in pixels. Default: 1080 */
  maxHeight?: number;
  /** WebP encode quality 0–1. Default: 0.82 */
  quality?:   number;
}

/**
 * Compress and convert an image File to WebP.
 * Returns a new File with `.webp` extension and `image/webp` MIME type.
 * Falls back to the original file if the browser does not support Canvas or WebP.
 */
export async function compressToWebP(
  file:    File,
  options: CompressOptions = {}
): Promise<File> {
  const { maxWidth = 1440, maxHeight = 1080, quality = 0.82 } = options;

  // Fast-path: if the file is already small WebP, skip re-encoding
  if (file.type === 'image/webp' && file.size < 300 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img       = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // ── Compute target dimensions (maintain aspect ratio) ──
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height);
        width  = Math.round(width  * scale);
        height = Math.round(height * scale);
      }

      // ── Draw onto canvas ──
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Canvas unsupported (extremely unlikely) — return original
        resolve(file);
        return;
      }

      // White background for transparent PNGs (WebP supports transparency
      // but white is safer for JPEG-style screenshots)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // ── Encode as WebP ──
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback: browser doesn't support WebP toBlob
            resolve(file);
            return;
          }

          // Only use the compressed version if it's actually smaller
          // (very small PNGs can occasionally get bigger when re-encoded)
          const compressed = blob.size < file.size ? blob : file;

          const webpName = file.name.replace(/\.[^.]+$/, '.webp');
          const outFile  = new File([compressed], webpName, {
            type:         'image/webp',
            lastModified: Date.now(),
          });

          resolve(outFile);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Can't load the image — return original unchanged
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Human-readable file size string. e.g. "1.2 MB" or "340 KB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024)            return `${bytes} B`;
  if (bytes < 1024 * 1024)     return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
