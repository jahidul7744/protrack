import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/** Transform flat DB record into the nested shape the frontend expects */
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

// GET /api/tasks
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const tasks = await prisma.task.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(tasks.map(toTaskShape));
}

// POST /api/tasks
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { projectId, task, output, nextStep, notes, status, progress } = body;

    if (!projectId || !task?.what) {
      return NextResponse.json({ message: 'projectId and task.what are required' }, { status: 400 });
    }

    const created = await prisma.task.create({
      data: {
        projectId,
        taskWhat: task?.what ?? '',
        taskWhen: task?.when ?? '',
        taskWho: task?.who ?? '',
        outputWhat: output?.what ?? '',
        outputWhen: output?.when ?? '',
        outputWho: output?.who ?? '',
        nextStepWhat: nextStep?.what ?? '',
        nextStepWhen: nextStep?.when ?? '',
        nextStepWho: nextStep?.who ?? '',
        notes: notes ?? '',
        status: status ?? 'To Do',
        progress: progress ?? 0,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(toTaskShape(created), { status: 201 });
  } catch (error) {
    console.error('[TASKS_POST]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
