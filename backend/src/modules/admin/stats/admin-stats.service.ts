// src/modules/admin/stats/admin-stats.service.ts
import { prisma } from '../../../config/database';
import { QuestionStatus } from '@prisma/client';

export const adminStatsService = {
  getDashboardStats: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysList = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    const [
      todaySessions,
      dau,
      mau,
      totalUsers,
      newUsersToday,
      suspiciousCount,
      poolHealth,
      historicalSessionsRaw,
      adStats,
      totalStartedToday,
    ] = await Promise.all([
      // Bugünkü oturumlar
      prisma.gameSession.aggregate({
        where: { createdAt: { gte: today, lt: tomorrow }, submittedAt: { not: null } },
        _count: { id: true },
        _avg: { scoreFinal: true },
      }),

      // DAU (Son 24 saat)
      prisma.user.count({
        where: { lastActiveAt: { gte: today } },
      }),

      // MAU (Son 30 gün)
      prisma.user.count({
        where: { lastActiveAt: { gte: thirtyDaysAgo } },
      }),

      // Toplam Kullanıcı
      prisma.user.count(),

      // Bugün Yeni Kayıt
      prisma.user.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),

      // Bugünkü şüpheli oturum sayısı
      prisma.gameSession.count({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          flagSuspicious: true,
        },
      }),

      // Modül başına havuz sağlığı
      prisma.question.groupBy({
        by: ['module'],
        where: { status: { notIn: [QuestionStatus.archived, QuestionStatus.archiving] } },
        _count: { id: true },
      }),

      // Geçmiş 7 gün (Grafik için) - Gruplanmış sorgu
      prisma.gameSession.findMany({
        where: {
          createdAt: { gte: sevenDaysList[0] },
          submittedAt: { not: null },
        },
        select: { createdAt: true },
      }),

      // Reklam kullanım istatistikleri
      prisma.gameSession.aggregate({
        where: { createdAt: { gte: today, lt: tomorrow }, adMultiplied: true },
        _count: { id: true },
      }),

      // Bugün başlatılan toplam oturum (Abandon rate için)
      prisma.gameSession.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
    ]);

    // Tarihleri grupla (Bellekte çünkü SQL'de gün bazlı gruplama DB tipine göre değişir)
    const activityMap = new Map<string, number>();
    historicalSessionsRaw.forEach((s) => {
      const key = s.createdAt.toLocaleDateString('tr-TR', { weekday: 'short' });
      activityMap.set(key, (activityMap.get(key) || 0) + 1);
    });

    const activityData = sevenDaysList.map((d) => {
      const name = d.toLocaleDateString('tr-TR', { weekday: 'short' });
      return {
        name,
        users: dau, // Basitlik için DAU'yu baz alıyoruz
        sessions: activityMap.get(name) || 0,
      };
    });

    // Tamamlama oranı: submitted / started
    const completionRate = totalStartedToday > 0
      ? Math.round((todaySessions._count.id / totalStartedToday) * 100)
      : 0;

    // Churn Rate (30 gündür girmeyenler / Toplam)
    const churnCount = await prisma.user.count({
      where: { lastActiveAt: { lt: thirtyDaysAgo } },
    });
    const churnRate = totalUsers > 0 ? Math.round((churnCount / totalUsers) * 100) : 0;

    return {
      today: {
        sessions: todaySessions._count.id,
        dau,
        mau,
        totalUsers,
        newUsersToday,
        completionRate,
        abandonRate: 100 - completionRate,
        avgScore: todaySessions._avg.scoreFinal ?? 0,
        adUsageCount: adStats._count.id,
        churnRate,
      },
      suspiciousCount,
      poolHealth: poolHealth.map(p => ({
        module: p.module,
        count: p._count.id,
        label: p.module.charAt(0).toUpperCase() + p.module.slice(1),
      })),
      activityData,
    };
  }
};
