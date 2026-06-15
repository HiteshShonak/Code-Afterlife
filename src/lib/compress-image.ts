// image compressor

export interface CompressOptions {
  // max width
  maxWidth?:  number;
  // max height
  maxHeight?: number;
  // webp quality
  quality?:   number;
}

// compress to webp
export async function compressToWebP(
  file:    File,
  options: CompressOptions = {}
): Promise<File> {
  const { maxWidth = 1440, maxHeight = 1080, quality = 0.82 } = options;

  // skip re-encoding for small webp
  if (file.type === 'image/webp' && file.size < 300 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img       = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // compute target dimensions
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height);
        width  = Math.round(width  * scale);
        height = Math.round(height * scale);
      }

      // draw onto canvas
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // canvas unsupported fallback
        resolve(file);
        return;
      }

      // white background for transparent pngs
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // encode as webp
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // fallback for missing webp support
            resolve(file);
            return;
          }

          // use compressed if smaller
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
      // cant load return original
      resolve(file);
    };

    img.src = objectUrl;
  });
}

// format size
export function formatFileSize(bytes: number): string {
  if (bytes < 1024)            return `${bytes} B`;
  if (bytes < 1024 * 1024)     return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
