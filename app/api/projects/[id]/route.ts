import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT /api/projects/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    if (project.createdBy !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: body.name,
        projectId: body.projectId,
        description: body.description ?? '',
        clientCompany: body.clientCompany ?? '',
        clientName: body.clientName ?? '',
        category: body.category ?? '',
        kam: body.kam ?? '',
        startDate: body.startDate ?? '',
        endDate: body.endDate ?? '',
        followUp: body.followUp ?? '',
        supervisedBy: body.supervisedBy ?? '',
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PROJECTS_PUT]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    if (project.createdBy !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('[PROJECTS_DELETE]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
