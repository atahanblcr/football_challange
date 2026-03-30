// prisma/seed.ts
import { PrismaClient, AdminRole, AuthProvider, EntityType, QuestionModule, QuestionStatus, Difficulty } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding process started...');

  // 1. Admin User
  const adminEmail = 'admin@footballchallenge.app';
  const hashedPassword = await bcrypt.hash('admin_password_123', 10);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      role: AdminRole.super_admin,
      isActive: true,
    },
  });

  // 2. App Config
  await prisma.appConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      minimum_version: '1.0.0',
      latest_version: '1.0.0',
      force_update: false,
    },
  });

  // 3. Create Entities (Using upsert or finding existing)
  const messiName = 'Lionel Messi';
  const messi = await prisma.entity.upsert({
    where: { id: 'seed-messi' },
    update: {},
    create: { id: 'seed-messi', name: messiName, type: EntityType.player, countryCode: 'AR', alias: ['Messi', 'Leo'] }
  });

  const ronaldoName = 'Cristiano Ronaldo';
  const ronaldo = await prisma.entity.upsert({
    where: { id: 'seed-ronaldo' },
    update: {},
    create: { id: 'seed-ronaldo', name: ronaldoName, type: EntityType.player, countryCode: 'PT', alias: ['CR7'] }
  });

  const barcaName = 'Barcelona';
  const barca = await prisma.entity.upsert({
    where: { id: 'seed-barca' },
    update: {},
    create: { id: 'seed-barca', name: barcaName, type: EntityType.club, countryCode: 'ES' }
  });

  // 4. Create Questions
  const q1Title = 'La Liga Tarihinin En Golcüleri';
  const q1 = await prisma.question.upsert({
    where: { id: 'seed-q1' },
    update: {},
    create: {
      id: 'seed-q1',
      title: q1Title,
      module: QuestionModule.players,
      status: QuestionStatus.active,
      difficulty: Difficulty.hard,
      answerCount: 10,
      createdBy: 'seeder',
      answers: {
        create: [
          { entityId: messi.id, rank: 10, statValue: '474', statDisplay: '474 Gol' },
          { entityId: ronaldo.id, rank: 9, statValue: '311', statDisplay: '311 Gol' },
        ]
      }
    }
  });

  // 5. Legendary User & Activity
  const userEmail = 'user@example.com';
  const userNickname = 'EfsaneForvet';
  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      nickname: userNickname,
      email: userEmail,
      authProvider: AuthProvider.google,
      countryCode: 'TR',
      referralCode: 'SEED2026',
      subscriptionTier: 'free',
    }
  });

  // 6. Game Sessions (Optional: avoid duplicates)
  const existingSession = await prisma.gameSession.findFirst({
    where: { userId: user.id, questionId: q1.id }
  });

  if (!existingSession) {
    const s1 = await prisma.gameSession.create({
      data: {
        userId: user.id,
        questionId: q1.id,
        startedAt: new Date(Date.now() - 3600000),
        submittedAt: new Date(Date.now() - 3500000),
        scoreBase: 80,
        scoreTimeBonus: 15,
        scoreDifficulty: 120,
        scoreFinal: 180,
        adMultiplied: true,
        allSlotsFilled: true,
        correctRanks: [10, 9]
      }
    });

    await prisma.pointHistory.create({
      data: {
        userId: user.id,
        sessionId: s1.id,
        module: QuestionModule.players,
        points: 180
      }
    });
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
