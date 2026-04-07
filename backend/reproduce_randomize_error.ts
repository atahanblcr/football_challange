import { prisma } from './src/config/database';
import { adminQuestionsService } from './src/modules/admin/questions/admin-questions.service';
import { QuestionModule, QuestionStatus, Difficulty } from '@prisma/client';

async function reproduce() {
  console.log('--- Randomize Hata Simülasyonu Başladı ---');

  // 1. Temizlik (Test sorularını sil)
  await prisma.question.deleteMany({
    where: { title: { startsWith: 'TEST_RANDOM_' } }
  });

  // 2. Sadece bir tane aktif soru ekle
  const q = await prisma.question.create({
    data: {
      title: 'TEST_RANDOM_1',
      module: 'players',
      difficulty: Difficulty.easy,
      status: QuestionStatus.active,
      basePoints: 100,
      timeLimit: 60,
      answerCount: 1,
      createdBy: 'test-admin',
      answers: {
        create: {
          entityId: 'cmnn1uhxy001tv6ra4li5ry6x',
          rank: 1,
          statValue: '10'
        }
      }
    }
  });
  console.log('Aktif soru eklendi:', q.id);

  const targetDate = '2026-04-10';

  try {
    console.log(`\nSenaryo 1: ${targetDate} için rastgele soru ata...`);
    const res1 = await adminQuestionsService.assignRandom(targetDate, 'players', false);
    console.log('Başarılı:', res1.questionId);

    console.log(`\nSenaryo 2: Aynı gün için tekrar rastgele soru ata (havuzda başka soru yok)...`);
    // Bu noktada findEligibleQuestion mevcut soruyu hariç tuttuğu için (currentQuestionId passing)
    // havuzda başka soru bulamamalı ve 400 hatası fırlatmalı.
    await adminQuestionsService.assignRandom(targetDate, 'players', false);
  } catch (error: any) {
    console.log('Beklenen Hata Yakalandı:', error.message);
  }

  // 3. Soru ekle ama draft olsun
  await prisma.question.create({
    data: {
      title: 'TEST_RANDOM_DRAFT',
      module: 'clubs',
      difficulty: Difficulty.easy,
      status: QuestionStatus.draft,
      basePoints: 100,
      timeLimit: 60,
      answerCount: 1,
      createdBy: 'test-admin',
    }
  });

  try {
    console.log('\nSenaryo 3: Sadece draft olan bir modül için rastgele ata...');
    await adminQuestionsService.assignRandom('2026-04-11', 'clubs', false);
  } catch (error: any) {
    console.log('Beklenen Hata Yakalandı (Draft Sorular):', error.message);
  }

  console.log('\n--- Simülasyon Bitti ---');
}

reproduce()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
