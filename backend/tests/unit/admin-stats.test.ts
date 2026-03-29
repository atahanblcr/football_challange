import { prisma } from '../../src/config/database';
import { adminStatsService } from '../../src/modules/admin/stats/admin-stats.service';
import { AuthProvider, QuestionModule, Difficulty, QuestionStatus } from '@prisma/client';

describe('Admin Stats Service Unit Test', () => {
  beforeAll(async () => {
    // Clear data
    await prisma.gameSession.deleteMany();
    await prisma.user.deleteMany();
    await prisma.question.deleteMany();

    const today = new Date();
    const thirtyOneDaysAgo = new Date(today);
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

    // 1. Create users
    const userActive = await prisma.user.create({
      data: {
        nickname: 'active_user',
        authProvider: AuthProvider.google,
        lastActiveAt: today,
        referralCode: 'REF1',
      }
    });

    const userChurned = await prisma.user.create({
      data: {
        nickname: 'churned_user',
        authProvider: AuthProvider.google,
        lastActiveAt: thirtyOneDaysAgo,
        referralCode: 'REF2',
      }
    });

    // 2. Create questions
    const question1 = await prisma.question.create({
      data: {
        title: 'Stats Test Question 1',
        module: QuestionModule.players,
        status: QuestionStatus.active,
        difficulty: Difficulty.easy,
        answerCount: 5,
        createdBy: 'stats_test_admin',
      }
    });

    const question2 = await prisma.question.create({
      data: {
        title: 'Stats Test Question 2',
        module: QuestionModule.players,
        status: QuestionStatus.active,
        difficulty: Difficulty.easy,
        answerCount: 5,
        createdBy: 'stats_test_admin',
      }
    });

    // 3. Create game sessions
    // Finished session (today)
    await prisma.gameSession.create({
      data: {
        userId: userActive.id,
        questionId: question1.id,
        startedAt: today,
        submittedAt: today,
        scoreFinal: 100,
        adMultiplied: true,
      }
    });

    // Abandoned session (today)
    await prisma.gameSession.create({
      data: {
        userId: userActive.id,
        questionId: question2.id,
        startedAt: today,
        submittedAt: null,
      }
    });
  });

  it('should calculate correct dashboard metrics', async () => {
    const stats = await adminStatsService.getDashboardStats();

    expect(stats.today.totalUsers).toBe(2);
    expect(stats.today.dau).toBe(1);
    expect(stats.today.mau).toBe(1); // Churned one is 31 days ago
    expect(stats.today.sessions).toBe(1); // Only submittedAt: not null
    expect(stats.today.completionRate).toBe(50); // 1 finished / 2 started
    expect(stats.today.abandonRate).toBe(50);
    expect(stats.today.adUsageCount).toBe(1);
    expect(stats.today.churnRate).toBe(50); // 1 churned / 2 total
    expect(stats.poolHealth.find(p => p.module === 'players')?.count).toBe(2);
  });
});
