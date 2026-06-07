import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { CapsuleType } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content, type, mediaUrl } = body;

    if (!title || !type) {
      return NextResponse.json({ message: 'Title and type are required' }, { status: 400 });
    }

    // Verify ownership
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Create the time capsule
    const capsule = await prisma.timeCapsule.create({
      data: {
        title,
        content: content || null,
        type: type as CapsuleType,
        mediaUrl: mediaUrl || null,
        projectId: id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, capsule }, { status: 201 });
  } catch (error) {
    console.error('Failed to create time capsule:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
