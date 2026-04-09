import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('demo1234', 12);

  // 1. Create Demo Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@protrack.com' },
    update: {},
    create: {
      email: 'admin@protrack.com',
      name: 'System Admin',
      password: hashedPassword,
      role: 'admin',
    },
  });

  // 2. Create Demo Normal User
  const user = await prisma.user.upsert({
    where: { email: 'demo@protrack.com' },
    update: {},
    create: {
      email: 'demo@protrack.com',
      name: 'Demo User',
      password: hashedPassword,
      role: 'user',
    },
  });

  console.log('✅ Demo users created:');
  console.log(`   Admin: admin@protrack.com / demo1234`);
  console.log(`   User:  demo@protrack.com / demo1234`);

  // 3. Create Sample Project
  const project = await prisma.project.upsert({
    where: { projectId: 'PRJ-DEMO' },
    update: {},
    create: {
      projectId: 'PRJ-DEMO',
      name: 'Modernize Infrastructure',
      description: 'Migrating from legacy systems to a modern PostgreSQL stack.',
      clientCompany: 'Tech Corp',
      clientName: 'Sarah Smith',
      category: 'IT Strategy',
      kam: 'Admin',
      startDate: '2026-04-01',
      endDate: '2026-12-31',
      createdBy: admin.id,
    },
  });

  // 4. Create Sample Task
  await prisma.task.create({
    data: {
      projectId: project.id,
      taskWhat: 'Database Migration',
      taskWhen: '2026-04-15',
      taskWho: 'Admin',
      outputWhat: 'Schema designed and pushed.',
      outputWhen: '2026-04-10',
      outputWho: 'Admin',
      nextStepWhat: 'Implement data validation.',
      nextStepWhen: '2026-04-20',
      nextStepWho: 'Admin',
      status: 'In Progress',
      progress: 65,
      createdBy: admin.id,
    },
  });

  console.log('✅ Sample project and task created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
