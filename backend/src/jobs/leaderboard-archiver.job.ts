import cron from 'node-cron';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { logger } from '../utils/logger.util';
import LeaderboardService from '../modules/leaderboard/leaderboard.service';

/**
 * leaderboard_archiver (Bölüm 13)
 * Zamanlama: Pazartesi 00:01 (haftalık), Ayın 1'i 00:01 (aylık), Oc/Nis/Tem/Eki 1'i 00:01 (3 aylık)
 * Görev: Redis snapshot'ı PostgreSQL'e yaz, Redis key'ini sil.
 */
export const leaderboardArchiverJob = () => {
  // Haftalık: Her Pazartesi 00:01
  cron.schedule('1 0 * * 1', () => archiveLeaderboard('weekly'), { timezone: "Europe/Istanbul" });

  // Aylık: Her ayın 1'i 00:01
  cron.schedule('1 0 1 * *', () => archiveLeaderboard('monthly'), { timezone: "Europe/Istanbul" });

  // 3 Aylık: Ocak, Nisan, Temmuz, Ekim 1'inde 00:01
  cron.schedule('1 0 1 1,4,7,10 *', () => archiveLeaderboard('quarterly'), { timezone: "Europe/Istanbul" });
};

async function archiveLeaderboard(period: 'weekly' | 'monthly' | 'quarterly') {
  logger.info(`[Job] Leaderboard archiver started for period: ${period}`);
  
  try {
    const now = new Date();
    // Bir önceki periyodu hesaplamamız gerekiyor çünkü 00:01'de çalışıyoruz ve yeni periyoda geçtik.
    // Ancak Redis key'lerimiz tarih içeriyor (örn: weekly:2025-W24).
    // Bu yüzden 'az önce biten' periyodun key'ini bulup arşivlemeliyiz.
    
    // Örnek: Şu an Pazartesi 00:01 ise, bir önceki haftanın key'ini arşivle.
    const lastPeriodKey = await getPreviousPeriodKey(period, now);
    const scopes = ['global', 'tr'];

    for (const scope of scopes) {
      const key = `leaderboard:${scope}:${lastPeriodKey}`;
      
      // Redis'ten veriyi çek (Top 100 veya hepsi?)
      // GEMINI.md Bölüm 5.8: JSONB rankings saklanır.
      const topRankings = await LeaderboardService.getLeaderboard({
        scope: scope,
        period: lastPeriodKey,
        limit: 100 // MVP'de sadece top 100 snapshot alıyoruz
      });

      if (topRankings.length > 0) {
        await prisma.leaderboardSnapshot.create({
          data: {
            period: period,
            periodKey: lastPeriodKey,
            scope: scope,
            snapshotAt: now,
            rankings: topRankings as any,
          }
        });
        
        // Key'i sil (Bölüm 9.4)
        await redis.del(key);
        // Modül bazlıları da silmemiz gerekir? 
        // Bölüm 9.1: leaderboard:global:weekly:<ISO-hafta>:players vb.
        const moduleKeys = await redis.keys(`${key}:*`);
        if (moduleKeys.length > 0) {
          await redis.del(...moduleKeys);
        }

        logger.info(`[Job] Archived and cleared leaderboard: ${key}`);
      }
    }
    
    logger.info(`[Job] Leaderboard archiver completed for period: ${period}`);
  } catch (error) {
    logger.error(`[Job] Leaderboard archiver failed for period ${period}:`, error);
  }
}

async function getPreviousPeriodKey(period: 'weekly' | 'monthly' | 'quarterly', now: Date): Promise<string> {
  const d = new Date(now);
  if (period === 'weekly') {
    // 1 hafta geri git
    d.setDate(d.getDate() - 7);
    return (LeaderboardService as any).getISOWeek(d);
  } else if (period === 'monthly') {
    // 1 ay geri git
    d.setMonth(d.setMonth(d.getMonth() - 1));
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  } else {
    // 3 ay geri git
    d.setMonth(d.setMonth(d.getMonth() - 3));
    const q = Math.floor(d.getMonth() / 3) + 1;
    return `${d.getFullYear()}-Q${q}`;
  }
}
