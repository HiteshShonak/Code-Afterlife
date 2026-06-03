import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateUploadSignature } from '@/lib/cloudinary.server';

/**
 * GET /api/upload/sign
 * Returns a signed Cloudinary upload signature.
 * Requires authentication — only signed-in users can upload.
 *
 * The signature authorises ONE upload to the 'code-afterlife/screenshots' folder.
 * The client calls this before each file upload.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = generateUploadSignature('code-afterlife/screenshots');
  return NextResponse.json(params);
}
