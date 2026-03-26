import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger.util';

/**
 * suspicious_flag_report (Bölüm 13)
 * Zamanlama: Her gün 08:00 (UTC+3)
 * Görev: Önceki günün flaglı oturumlarını özetle (Log olarak veya Admin DB'ye rapor).
 */
export const suspiciousFlagReportJob = () => {
  cron.schedule('0 8 * * *', async () => {
    logger.info('[Job] Suspicious flag report started.');
    
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const flaggedSessions = await prisma.gameSession.findMany({
        where: {
          flagSuspicious: true,
          submittedAt: { gte: yesterday }
        },
        include: {
          user: { select: { nickname: true } },
          question: { select: { title: true } }
        }
      });

      if (flaggedSessions.length > 0) {
        logger.warn(`[Job] Found ${flaggedSessions.length} suspicious sessions yesterday!`);
        flaggedSessions.forEach(s => {
          logger.warn(` - User: ${s.user.nickname}, Session: ${s.id}, Reason: ${s.suspiciousReason}`);
        });
      } else {
        logger.info('[Job] No suspicious sessions found yesterday.');
      }
    } catch (error) {
      logger.error('[Job] Suspicious flag report failed:', error);
    }
  }, {
    timezone: "Europe/Istanbul"
  });
};
