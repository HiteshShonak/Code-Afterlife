import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';

cloudinary.config({

  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

export async function deleteCloudinaryImages(publicIds: string[]): Promise<void> {
  if (!publicIds.length) return;
  try {
    await cloudinary.api.delete_resources(publicIds, { resource_type: 'image' });
  } catch (err) {
    logger.error('[cloudinary] orphan cleanup failed', { err });
  }
}

export function generateUploadSignature(folder: string): {
  signature:  string;
  timestamp:  number;
  cloudName:  string;
  apiKey:     string;
  folder:     string;
} {
  if (
    !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw ApiError.internal('Cloudinary upload is not configured');
  }

  const timestamp = Math.round(Date.now() / 1000);
  const params    = { folder, timestamp };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    apiKey:    process.env.CLOUDINARY_API_KEY!,
    folder,
  };
}

export { cloudinary };
