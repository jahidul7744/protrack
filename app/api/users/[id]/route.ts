import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT /api/users/[id]  — update role (admin only)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  try {
    const { role } = await req.json();
    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }
    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[USERS_PUT]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/users/[id]  (admin only)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    console.error('[USERS_DELETE]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
