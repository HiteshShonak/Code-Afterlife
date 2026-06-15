import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({

  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// delete images
export async function deleteCloudinaryImages(publicIds: string[]): Promise<void> {
  if (!publicIds.length) return;
  try {
    await cloudinary.api.delete_resources(publicIds, { resource_type: 'image' });
  } catch (err) {
    // dont crash on fail
    console.error('[cloudinary] orphan cleanup failed:', err);
  }
}

// generate signature
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
