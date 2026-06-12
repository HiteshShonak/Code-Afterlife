import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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
    const { title, description } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 });
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

    // Check rate limit: 1 manual UPDATE per 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentUpdate = await prisma.timelineEntry.findFirst({
      where: {
        projectId: id,
        type: 'UPDATE',
        createdAt: { gte: oneDayAgo }
      }
    });

    if (recentUpdate) {
      return NextResponse.json(
        { message: 'You can only post one manual update every 24 hours.' }, 
        { status: 429 }
      );
    }

    // Create entry and update project's lastActivityAt
    // This bumps the health automatically by updating lastActivityAt
    const [entry] = await prisma.$transaction([
      prisma.timelineEntry.create({
        data: {
          projectId: id,
          type: 'UPDATE',
          title: title.trim(),
          description: description?.trim() || null,
        }
      }),
      prisma.project.update({
        where: { id },
        data: { lastActivityAt: new Date(), state: 'ACTIVE' } // Force ACTIVE if it was STALLED
      })
    ]);

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    console.error('Failed to add timeline entry:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
