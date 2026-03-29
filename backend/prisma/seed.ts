// prisma/seed.ts
import { PrismaClient, AdminRole, AuthProvider, EntityType, QuestionModule, QuestionStatus, Difficulty } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding process started...');

  // 1. Admin User
  const email = 'admin@footballchallenge.app';
  const hashedPassword = await bcrypt.hash('admin_password_123', 10);
  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
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

  // 3. Create Entities
  const messi = await prisma.entity.create({
    data: { name: 'Lionel Messi', type: EntityType.player, countryCode: 'AR', alias: ['Messi', 'Leo'] }
  });
  const ronaldo = await prisma.entity.create({
    data: { name: 'Cristiano Ronaldo', type: EntityType.player, countryCode: 'PT', alias: ['CR7'] }
  });
  const barca = await prisma.entity.create({
    data: { name: 'Barcelona', type: EntityType.club, countryCode: 'ES' }
  });

  // 4. Create Questions
  const q1 = await prisma.question.create({
    data: {
      title: 'La Liga Tarihinin En Golcüleri',
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
  const user = await prisma.user.create({
    data: {
      nickname: 'EfsaneForvet',
      email: 'user@example.com',
      authProvider: AuthProvider.google,
      countryCode: 'TR',
      referralCode: 'SEED2026',
      subscriptionTier: 'free',
    }
  });

  // Başarılı Oturum
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

  // Şüpheli Oturum (Çok hızlı bitmiş)
  await prisma.gameSession.create({
    data: {
      userId: user.id,
      questionId: (await prisma.question.create({
        data: { title: 'Fake Question', module: QuestionModule.clubs, answerCount: 10, createdBy: 'seeder', difficulty: 'easy' }
      })).id,
      startedAt: new Date(),
      submittedAt: new Date(),
      flagSuspicious: true,
      suspiciousReason: 'Hızlı tamamlama: 2s (Gereken: 40s)',
      scoreFinal: 0
    }
  });

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
