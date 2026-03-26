import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger.util';
import { QuestionModule, QuestionStatus } from '@prisma/client';

/**
 * pool_health_check (Bölüm 13)
 * Zamanlama: Her gün 09:00 (UTC+3)
 * Görev: Her modülde kaç aktif soru kaldığını hesapla, eşik altındaysa (7) admin uyarısı oluştur.
 */
export const poolHealthCheckJob = () => {
  cron.schedule('0 9 * * *', async () => {
    logger.info('[Job] Pool health check started.');
    
    const modules: QuestionModule[] = ['players', 'clubs', 'nationals', 'managers'];
    const CRITICAL_THRESHOLD = 7;
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    try {
      for (const module of modules) {
        const count = await prisma.question.count({
          where: {
            module: module,
            status: QuestionStatus.active,
            isSpecial: false,
            OR: [
              { lastShownAt: null },
              { lastShownAt: { lt: ninetyDaysAgo } }
            ]
          }
        });

        if (count < CRITICAL_THRESHOLD) {
          logger.warn(`[Job] Pool Health Warning: Module ${module} has only ${count} questions left in eligible pool!`);
          // TODO: Admin panel için özel bir 'Alerts' tablosuna yazılabilir veya e-posta gönderilebilir.
        } else {
          logger.info(`[Job] Pool Health: Module ${module} has ${count} questions.`);
        }
      }
      
      logger.info('[Job] Pool health check completed.');
    } catch (error) {
      logger.error('[Job] Pool health check failed:', error);
    }
  }, {
    timezone: "Europe/Istanbul"
  });
};
