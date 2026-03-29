import { prisma } from '../../src/config/database';
import { runDailyQuestionSelector } from '../../src/jobs/daily-question-selector.job';
import { QuestionModule, QuestionStatus, Difficulty } from '@prisma/client';

describe('Daily Question Selector Logic Tests (90-day Cooldown)', () => {
  // Use a module for testing that we can isolate
  const testModule: QuestionModule = 'managers';
  const testAdminId = 'job_test_admin';

  beforeAll(async () => {
    // 1. First cleanup ANY existing data that could interfere
    await prisma.gameSession.deleteMany();
    await prisma.dailyQuestionAssignment.deleteMany();
    await prisma.questionAnswer.deleteMany();
    // 2. Clear ALL questions for our test module specifically
    await prisma.question.deleteMany({ where: { module: testModule } });
  });

  afterAll(async () => {
    await prisma.dailyQuestionAssignment.deleteMany();
    await prisma.question.deleteMany({ where: { createdBy: testAdminId } });
  });

  it('should only select an ACTIVE question that is NOT in cooldown', async () => {
    // Clear for this test specifically
    await prisma.dailyQuestionAssignment.deleteMany();
    await prisma.question.deleteMany({ where: { module: testModule } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ninetyOneDaysAgo = new Date();
    ninetyOneDaysAgo.setDate(ninetyOneDaysAgo.getDate() - 91);

    const eightyNineDaysAgo = new Date();
    eightyNineDaysAgo.setDate(eightyNineDaysAgo.getDate() - 89);

    // 1. Recently shown (Excluded)
    await prisma.question.create({
      data: {
        title: 'Recently Shown Question',
        module: testModule,
        status: QuestionStatus.active,
        difficulty: Difficulty.easy,
        answerCount: 5,
        createdBy: testAdminId,
        lastShownAt: eightyNineDaysAgo,
      }
    });

    // 2. Draft (Excluded)
    await prisma.question.create({
      data: {
        title: 'Draft Question',
        module: testModule,
        status: QuestionStatus.draft,
        difficulty: Difficulty.easy,
        answerCount: 5,
        createdBy: testAdminId,
      }
    });

    // 3. Fresh New Question (Eligible)
    const qNew = await prisma.question.create({
      data: {
        title: 'Fresh New Question',
        module: testModule,
        status: QuestionStatus.active,
        difficulty: Difficulty.easy,
        answerCount: 5,
        createdBy: testAdminId,
        lastShownAt: null,
      }
    });

    // 4. Very Old Question (Eligible)
    const qOld = await prisma.question.create({
      data: {
        title: 'Very Old Question',
        module: testModule,
        status: QuestionStatus.active,
        difficulty: Difficulty.easy,
        answerCount: 5,
        createdBy: testAdminId,
        lastShownAt: ninetyOneDaysAgo,
      }
    });

    // Run selector
    await runDailyQuestionSelector();

    // Verify assignment for our module
    const assignment = await prisma.dailyQuestionAssignment.findFirst({
      where: { date: { gte: today }, module: testModule },
      include: { question: true }
    });

    expect(assignment).toBeDefined();
    // It should pick either qNew or qOld, but NEVER Recently Shown or Draft
    const eligibleIds = [qNew.id, qOld.id];
    expect(eligibleIds).toContain(assignment?.questionId);
    expect(assignment?.question.title).not.toBe('Recently Shown Question');
    expect(assignment?.question.title).not.toBe('Draft Question');
  });
});
