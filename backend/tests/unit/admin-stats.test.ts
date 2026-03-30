import { prisma } from '../../src/config/database';
import { adminStatsService } from '../../src/modules/admin/stats/admin-stats.service';
import { AuthProvider, QuestionModule, Difficulty, QuestionStatus } from '@prisma/client';

describe('Admin Stats Service Unit Test', () => {
  beforeAll(async () => {
    // Selective cleanup: only delete related to this test's unique IDs
    await prisma.gameSession.deleteMany({
      where: { user: { nickname: { in: ['active_user', 'churned_user'] } } }
    });
    await prisma.user.deleteMany({
      where: { nickname: { in: ['active_user', 'churned_user'] } }
    });
    await prisma.question.deleteMany({
      where: { createdBy: 'stats_test_admin' }
    });

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
    // Get initial counts to be dynamic
    const totalUsersInDb = await prisma.user.count();
    
    const stats = await adminStatsService.getDashboardStats();

    expect(stats.today.totalUsers).toBe(totalUsersInDb);
    expect(stats.today.dau).toBeGreaterThanOrEqual(1);
    expect(stats.today.mau).toBeGreaterThanOrEqual(1);
    expect(stats.today.sessions).toBeGreaterThanOrEqual(1); 
    expect(stats.today.completionRate).toBeDefined();
    expect(stats.poolHealth.find(p => p.module === 'players')?.count).toBeGreaterThanOrEqual(2);
  });
});
