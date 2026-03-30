
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEntities() {
  const entities = await prisma.entity.findMany({
    where: {
      OR: [
        { name: { contains: 'Jose', mode: 'insensitive' } },
        { name: { contains: 'Mourinho', mode: 'insensitive' } },
        { name: { contains: 'Messi', mode: 'insensitive' } }
      ]
    },
    take: 10
  });

  console.log('--- Entities found ---');
  console.log(JSON.stringify(entities, null, 2));
}

checkEntities()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
