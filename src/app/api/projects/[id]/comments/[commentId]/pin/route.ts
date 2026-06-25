import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { logger } from '@/lib/logger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    
    const project = await prisma.project.findUnique({
      where: { id: resolvedParams.id },
      select: { userId: true },
    });

    if (!project || project.userId !== user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const comment = await prisma.projectComment.findFirst({
      where: { id: resolvedParams.commentId, projectId: resolvedParams.id },
      select: { isPinned: true },
    });

    if (!comment) {
      return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
    }

    const updatedComment = await prisma.projectComment.update({
      where: { id: resolvedParams.commentId },
      data: { isPinned: !comment.isPinned },
    });

    return NextResponse.json({ success: true, isPinned: updatedComment.isPinned });
  } catch (error) {
    logger.error('Failed to pin comment', { error });
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
