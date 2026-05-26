import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({

  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

/**
 * Delete an array of Cloudinary public_ids.
 * Used for orphan cleanup when project creation fails after upload.
 * Fails silently on individual errors so it never blocks the user flow.
 */
export async function deleteCloudinaryImages(publicIds: string[]): Promise<void> {
  if (!publicIds.length) return;
  try {
    await cloudinary.api.delete_resources(publicIds, { resource_type: 'image' });
  } catch (err) {
    // Log but don't throw — orphan cleanup must never crash the caller
    console.error('[cloudinary] orphan cleanup failed:', err);
  }
}

/**
 * Generate a signed Cloudinary upload signature.
 * Called server-side so the API secret never reaches the client.
 */
export function generateUploadSignature(folder: string): {
  signature:  string;
  timestamp:  number;
  cloudName:  string;
  apiKey:     string;
  folder:     string;
} {
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
