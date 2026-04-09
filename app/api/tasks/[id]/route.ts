import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

function toTaskShape(t: any) {
  return {
    id: t.id,
    projectId: t.projectId,
    task: { what: t.taskWhat ?? '', when: t.taskWhen ?? '', who: t.taskWho ?? '' },
    output: { what: t.outputWhat ?? '', when: t.outputWhen ?? '', who: t.outputWho ?? '' },
    nextStep: { what: t.nextStepWhat ?? '', when: t.nextStepWhen ?? '', who: t.nextStepWho ?? '' },
    notes: t.notes ?? '',
    status: t.status,
    progress: t.progress,
    attachments: [],
    createdBy: t.createdBy,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt?.toISOString(),
  };
}

// PUT /api/tasks/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: 'Task not found' }, { status: 404 });

    if (existing.createdBy !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Build update payload — support both full update and partial (status/progress/section)
    const data: Record<string, any> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.progress !== undefined) data.progress = body.progress;

    if (body.task) {
      data.taskWhat = body.task.what ?? existing.taskWhat;
      data.taskWhen = body.task.when ?? existing.taskWhen;
      data.taskWho = body.task.who ?? existing.taskWho;
    }
    if (body.output) {
      data.outputWhat = body.output.what ?? existing.outputWhat;
      data.outputWhen = body.output.when ?? existing.outputWhen;
      data.outputWho = body.output.who ?? existing.outputWho;
    }
    if (body.nextStep) {
      data.nextStepWhat = body.nextStep.what ?? existing.nextStepWhat;
      data.nextStepWhen = body.nextStep.when ?? existing.nextStepWhen;
      data.nextStepWho = body.nextStep.who ?? existing.nextStepWho;
    }
    if (body.notes !== undefined) data.notes = body.notes;

    // Full update (from edit dialog)
    if (body.projectId) {
      data.projectId = body.projectId;
      data.taskWhat = body.task?.what ?? existing.taskWhat;
      data.taskWhen = body.task?.when ?? existing.taskWhen;
      data.taskWho = body.task?.who ?? existing.taskWho;
      data.outputWhat = body.output?.what ?? '';
      data.outputWhen = body.output?.when ?? '';
      data.outputWho = body.output?.who ?? '';
      data.nextStepWhat = body.nextStep?.what ?? '';
      data.nextStepWhen = body.nextStep?.when ?? '';
      data.nextStepWho = body.nextStep?.who ?? '';
      data.notes = body.notes ?? '';
      data.status = body.status ?? existing.status;
      data.progress = body.progress ?? existing.progress;
    }

    const updated = await prisma.task.update({ where: { id }, data });
    return NextResponse.json(toTaskShape(updated));
  } catch (error) {
    console.error('[TASKS_PUT]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    if (existing.createdBy !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('[TASKS_DELETE]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
