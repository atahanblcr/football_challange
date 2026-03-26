import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger.util';

/**
 * daily_limit_reset (Bölüm 13)
 * Zamanlama: Her gün 00:00 (UTC+3)
 * Görev: Kullanıcıların günlük soru ve reklam sayaçlarını sıfırla.
 * Not: MVP'de game_sessions üzerinden limit kontrolü yapıyoruz, 
 * ancak gerekirse kullanıcı tablosunda özel sayaçlar tutulabilir.
 * Şimdilik bu job, istatistiksel temizlik veya özel sayaç sıfırlama için iskelet görevi görür.
 */
export const dailyLimitResetJob = () => {
  // 0 0 * * * => Her gün gece yarısı
  // Ancak sunucu saati UTC ise Istanbul (UTC+3) için: 21 00 * * *
  cron.schedule('0 0 * * *', async () => {
    logger.info('[Job] Daily limit reset started.');
    try {
      // Gelecekte User tablosunda 'dailyQuestionsPlayed' gibi bir alan olursa burada sıfırlanacak.
      // Şu an dinamik olarak game_sessions üzerinden sayıyoruz.
      logger.info('[Job] Daily limit reset completed successfully.');
    } catch (error) {
      logger.error('[Job] Daily limit reset failed:', error);
    }
  }, {
    timezone: "Europe/Istanbul"
  });
};
