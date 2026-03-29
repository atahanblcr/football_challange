import { prisma } from '../../src/config/database';
import { runDailyQuestionSelector } from '../../src/jobs/daily-question-selector.job';
import { QuestionModule, QuestionStatus, Difficulty } from '@prisma/client';

describe('Daily Question Selector Logic Tests (90-day Cooldown)', () => {
  beforeAll(async () => {
    // Clear assignments and specifically our test questions
    await prisma.dailyQuestionAssignment.deleteMany();
    await prisma.question.deleteMany({ where: { createdBy: 'job_test_admin' } });
  });

  afterAll(async () => {
    await prisma.dailyQuestionAssignment.deleteMany();
    await prisma.question.deleteMany({ where: { createdBy: 'job_test_admin' } });
  });

  it('should NOT select a question shown in the last 90 days', async () => {
    // Ensure clean state for THIS test
    await prisma.dailyQuestionAssignment.deleteMany();
    await prisma.question.deleteMany({ where: { createdBy: 'job_test_admin' } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eightyNineDaysAgo = new Date();
    eightyNineDaysAgo.setDate(eightyNineDaysAgo.getDate() - 89);

    const module: QuestionModule = 'players';

    // 1. Create a question shown 89 days ago (Should NOT be selected)
    const qRecentlyShown = await prisma.question.create({
      data: {
        title: 'Recently Shown Question',
        module,
        status: QuestionStatus.active,
        difficulty: Difficulty.easy,
        answerCount: 5,
        createdBy: 'job_test_admin',
        lastShownAt: eightyNineDaysAgo,
      }
    });

    // 2. Create a question never shown (Should BE selected)
    const qNew = await prisma.question.create({
      data: {
        title: 'Fresh New Question',
        module,
        status: QuestionStatus.active,
        difficulty: Difficulty.easy,
        answerCount: 5,
        createdBy: 'job_test_admin',
        lastShownAt: null,
      }
    });

    // 3. Run the selector logic
    await runDailyQuestionSelector();

    // 4. Check assignment
    const assignment = await prisma.dailyQuestionAssignment.findFirst({
      where: { date: { gte: today }, module },
      include: { question: true }
    });

    expect(assignment).toBeDefined();
    expect(assignment?.question.title).toBe('Fresh New Question');
    expect(assignment?.questionId).not.toBe(qRecentlyShown.id);
  });

  it('should select a question shown MORE than 90 days ago', async () => {
    // Clean up specifically for this test
    await prisma.dailyQuestionAssignment.deleteMany();
    await prisma.question.deleteMany({ where: { createdBy: 'job_test_admin' } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ninetyOneDaysAgo = new Date();
    ninetyOneDaysAgo.setDate(ninetyOneDaysAgo.getDate() - 91);

    const module: QuestionModule = 'players';

    const qOld = await prisma.question.create({
      data: {
        title: 'Very Old Question',
        module,
        status: QuestionStatus.active,
        difficulty: Difficulty.easy,
        answerCount: 5,
        createdBy: 'job_test_admin',
        lastShownAt: ninetyOneDaysAgo,
      }
    });

    await runDailyQuestionSelector();

    const assignment = await prisma.dailyQuestionAssignment.findFirst({
      where: { date: { gte: today }, module },
      include: { question: true }
    });

    expect(assignment?.question.title).toBe('Very Old Question');
  });
});
