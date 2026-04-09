import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/projects
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(projects);
}

// POST /api/projects
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, projectId, description, clientCompany, clientName, category, kam, startDate, endDate, followUp, supervisedBy } = body;

    if (!name || !projectId) {
      return NextResponse.json({ message: 'Name and Project ID are required' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name,
        projectId,
        description: description || '',
        clientCompany: clientCompany || '',
        clientName: clientName || '',
        category: category || '',
        kam: kam || '',
        startDate: startDate || '',
        endDate: endDate || '',
        followUp: followUp || '',
        supervisedBy: supervisedBy || '',
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'A project with this ID already exists' }, { status: 409 });
    }
    console.error('[PROJECTS_POST]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
