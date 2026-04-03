import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger.util';
import { QuestionModule, QuestionStatus } from '@prisma/client';

/**
 * daily_question_selector (Bölüm 13)
 * Zamanlama: Her gün 00:05 (UTC+3)
 * Görev: Her modül için havuzdan rastgele soru seç, daily_question_assignments'a yaz.
 */
export const dailyQuestionSelectorJob = () => {
  cron.schedule('5 0 * * *', async () => {
    await runDailyQuestionSelector();
  }, {
    timezone: "Europe/Istanbul"
  });
};

export const runDailyQuestionSelector = async () => {
  logger.info('[Job] Daily question selector started.');
  
  const modules: QuestionModule[] = ['players', 'clubs', 'nationals', 'managers'];
  const DAYS_TO_PREFILL = 7;

  try {
    // Önümüzdeki 7 günü tara ve boş günlere atama yap
    for (let i = 0; i < DAYS_TO_PREFILL; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      targetDate.setHours(0, 0, 0, 0);

      const datePart = targetDate.toISOString().split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      const scheduledDate = new Date(Date.UTC(year, month - 1, day));

      for (const module of modules) {
        // 1. Zaten seçilmiş mi kontrol et
        const existing = await prisma.dailyQuestionAssignment.findUnique({
          where: {
            date_module_isExtra: {
              date: scheduledDate,
              module: module,
              isExtra: false,
            }
          }
        });

        if (existing) {
          logger.info(`[Job] Module ${module} already has a question for ${datePart}.`);
          continue;
        }

        // 2. Havuzdan uygun bir soru seç
        // Şartlar: Modül doğru, statüsü ACTIVE, isSpecial FALSE, 90 günlük cooldown geçmemiş
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // Not: Şu anki ve gelecekteki atamaları da hariç tutalım ki aynı hafta içinde aynı soru gelmesin
        const currentlyAssignedIds = await prisma.dailyQuestionAssignment.findMany({
          where: {
            date: { gte: ninetyDaysAgo }
          },
          select: { questionId: true }
        });
        const excludedIds = currentlyAssignedIds.map(a => a.questionId);

        const pool = await prisma.question.findMany({
          where: {
            module: module,
            status: QuestionStatus.active,
            isSpecial: false,
            id: { notIn: excludedIds },
            OR: [
              { lastShownAt: null },
              { lastShownAt: { lt: ninetyDaysAgo } }
            ]
          },
          select: { id: true }
        });

        if (pool.length === 0) {
          logger.warn(`[Job] No eligible questions in pool for module: ${module} on ${datePart}`);
          continue;
        }

        const randomQuestion = pool[Math.floor(Math.random() * pool.length)];

        // 3. Atamayı yap
        await prisma.$transaction([
          prisma.dailyQuestionAssignment.create({
            data: {
              date: scheduledDate,
              module: module,
              questionId: randomQuestion.id,
            }
          }),
          prisma.question.update({
            where: { id: randomQuestion.id },
            data: { lastShownAt: scheduledDate }
          })
        ]);

        logger.info(`[Job] Assigned question ${randomQuestion.id} to module ${module} for ${datePart}`);
      }
    }
    
    logger.info('[Job] Daily question selector completed successfully.');
  } catch (error) {
    logger.error('[Job] Daily question selector failed:', error);
    throw error;
  }
};
