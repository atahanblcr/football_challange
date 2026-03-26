import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger.util';
import { QuestionStatus } from '@prisma/client';

/**
 * cooldown_cleanup (Bölüm 13)
 * Zamanlama: Her gün 01:00 (UTC+3)
 * Görev: 90 günü dolan soruları havuza geri al (last_shown_at kontrolü).
 * Not: Bu job, soruların 'active' durumunu veya 'lastShownAt' tarihini 
 * kontrol ederek havuz sağlığını korur.
 */
export const cooldownCleanupJob = () => {
  cron.schedule('0 1 * * *', async () => {
    logger.info('[Job] Cooldown cleanup started.');
    
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // 90 günü dolmuş ama statüsü hala active olan (veya pool'a dönebilir) soruları bul
      // Aslında daily_question_selector zaten bu kontrolü yapıyor. 
      // Bu job daha çok loglama ve havuz analizi için kullanılabilir.
      
      const count = await prisma.question.count({
        where: {
          status: QuestionStatus.active,
          lastShownAt: { lt: ninetyDaysAgo }
        }
      });

      logger.info(`[Job] Cooldown cleanup finished. ${count} questions are now fully eligible in the pool.`);
    } catch (error) {
      logger.error('[Job] Cooldown cleanup failed:', error);
    }
  }, {
    timezone: "Europe/Istanbul"
  });
};
