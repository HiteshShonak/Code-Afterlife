import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateUploadSignature } from '@/lib/cloudinary.server';
import { ApiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = generateUploadSignature('code-afterlife/screenshots');
    return NextResponse.json(params);
  } catch (error) {
    logger.error('Cloudinary upload signature failed', { error });
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
