import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isToday, isPast, parseISO } from 'date-fns';
import { format } from 'date-fns';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Get all tasks with a next step that has a date
    const tasks = await prisma.task.findMany({
      where: {
        nextStepWhat: { not: "" },
        nextStepWhen: { not: "" },
      }
    });

    const today = new Date();
    const tasksToPromote = tasks.filter(t => {
      if (!t.nextStepWhen) return false;
      try {
        const date = parseISO(t.nextStepWhen);
        return isToday(date) || isPast(date);
      } catch (e) {
        return false;
      }
    });

    if (tasksToPromote.length === 0) {
      return NextResponse.json({ message: 'No tasks to promote' });
    }

    // 2. Perform updates in a transaction
    const updates = tasksToPromote.map(task => {
      return prisma.task.update({
        where: { id: task.id },
        data: {
          taskWhat: task.nextStepWhat as string,
          taskWhen: task.nextStepWhen || format(today, 'yyyy-MM-dd'),
          taskWho: task.nextStepWho || task.taskWho,
          outputWhat: "",
          outputWhen: "",
          outputWho: "",
          nextStepWhat: "",
          nextStepWhen: "",
          nextStepWho: "",
          status: 'To Do',
          progress: 0,
        }
      });
    });

    await prisma.$transaction(updates);

    return NextResponse.json({ 
      message: `Successfully promoted ${tasksToPromote.length} tasks`,
      count: tasksToPromote.length 
    });
  } catch (error: any) {
    console.error('Auto-promote error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
