import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deleteCloudinaryImages } from '@/lib/cloudinary.server';

// delete orphaned images
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const publicIds: unknown = body?.publicIds;

  if (!Array.isArray(publicIds) || publicIds.length === 0) {
    return NextResponse.json({ error: 'publicIds array required' }, { status: 400 });
  }

  // Validate: max 5, strings only, must start with our folder prefix
  const safe = (publicIds as unknown[])
    .filter(
      (id): id is string =>
        typeof id === 'string' &&
        id.startsWith('code-afterlife/') &&
        id.length < 200
    )
    .slice(0, 5);

  await deleteCloudinaryImages(safe);

  return NextResponse.json({ deleted: safe.length });
}
