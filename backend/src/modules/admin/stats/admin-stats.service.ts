// src/modules/admin/stats/admin-stats.service.ts
import { prisma } from '../../../config/database';
import { QuestionStatus } from '@prisma/client';

export const adminStatsService = {
  getDashboardStats: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      todaySessions,
      activeUsers,
      suspiciousCount,
      poolHealth,
    ] = await Promise.all([
      // Bugünkü oturumlar
      prisma.gameSession.aggregate({
        where: { createdAt: { gte: today, lt: tomorrow }, submittedAt: { not: null } },
        _count: { id: true },
        _avg: { scoreFinal: true },
      }),

      // Aktif kullanıcı sayısı (son 7 günde giriş yapan)
      prisma.user.count({
        where: { lastActiveAt: { gte: sevenDaysAgo } },
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
    ]);

    // Tamamlama oranı: submitted / started
    const startedCount = await prisma.gameSession.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    });
    const finishedCount = await prisma.gameSession.count({
      where: {
        createdAt: { gte: today, lt: tomorrow },
        submittedAt: { not: null },
      },
    });
    const completionRate = startedCount > 0
      ? Math.round((finishedCount / startedCount) * 100)
      : 0;

    return {
      today: {
        sessions: todaySessions._count.id,
        activeUsers,
        completionRate,
        avgScore: todaySessions._avg.scoreFinal ?? 0,
      },
      suspiciousCount,
      poolHealth: poolHealth.map(p => ({
        module: p.module,
        count: p._count.id,
        label: p.module.charAt(0).toUpperCase() + p.module.slice(1),
      })),
    };
  }
};
