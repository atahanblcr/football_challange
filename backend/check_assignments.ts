
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAssignments() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const assignments = await prisma.dailyQuestionAssignment.findMany({
    include: {
      question: { select: { title: true, module: true } }
    },
    orderBy: { date: 'desc' },
    take: 10
  });

  console.log('--- Son 10 Günlük Atama ---');
  console.log(JSON.stringify(assignments, null, 2));
}

checkAssignments()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
