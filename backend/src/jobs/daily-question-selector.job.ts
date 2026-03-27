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
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const modules: QuestionModule[] = ['players', 'clubs', 'nationals', 'managers'];

  try {
    for (const module of modules) {
      // 1. Zaten seçilmiş mi kontrol et
      const existing = await prisma.dailyQuestionAssignment.findUnique({
        where: {
          date_module_isExtra: {
            date: today,
            module: module,
            isExtra: false,
          }
        }
      });

      if (existing) {
        logger.info(`[Job] Module ${module} already has a question for today.`);
        continue;
      }

      // 2. Havuzdan uygun bir soru seç
      // Şartlar: Modül doğru, statüsü ACTIVE, isSpecial FALSE, 90 günlük cooldown geçmemiş
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const pool = await prisma.question.findMany({
        where: {
          module: module,
          status: QuestionStatus.active,
          isSpecial: false,
          OR: [
            { lastShownAt: null },
            { lastShownAt: { lt: ninetyDaysAgo } }
          ]
        },
        select: { id: true }
      });

      if (pool.length === 0) {
        logger.warn(`[Job] No eligible questions in pool for module: ${module}`);
        continue;
      }

      const randomQuestion = pool[Math.floor(Math.random() * pool.length)];

      // 3. Atamayı yap
      await prisma.$transaction([
        prisma.dailyQuestionAssignment.create({
          data: {
            date: today,
            module: module,
            questionId: randomQuestion.id,
          }
        }),
        prisma.question.update({
          where: { id: randomQuestion.id },
          data: { lastShownAt: today }
        })
      ]);

      logger.info(`[Job] Assigned question ${randomQuestion.id} to module ${module} for ${today.toISOString().split('T')[0]}`);
    }
    
    logger.info('[Job] Daily question selector completed successfully.');
  } catch (error) {
    logger.error('[Job] Daily question selector failed:', error);
    throw error;
  }
};
