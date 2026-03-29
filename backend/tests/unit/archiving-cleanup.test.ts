import { prisma } from '../../src/config/database';
import { archivingCleanupJob } from '../../src/jobs/archiving-cleanup.job';
import { QuestionStatus, QuestionModule, Difficulty } from '@prisma/client';
import cron from 'node-cron';

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn((pattern, fn) => {
    // Return a mock task object with a stop method
    return { stop: jest.fn(), start: jest.fn(), fn }; 
  }),
}));

describe('Archiving Cleanup Job Unit Test', () => {
  let cleanupFn: Function;

  beforeAll(async () => {
    // Initialize the job and capture the function passed to cron.schedule
    archivingCleanupJob();
    cleanupFn = (cron.schedule as jest.Mock).mock.calls[0][1];

    // Cleanup
    await prisma.question.deleteMany({ where: { createdBy: 'archive_test_admin' } });
  });

  afterAll(async () => {
    await prisma.question.deleteMany({ where: { createdBy: 'archive_test_admin' } });
  });

  it('should move questions from archiving to archived after 10 minutes', async () => {
    const elevenMinutesAgo = new Date(Date.now() - 11 * 60 * 1000);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // 1. Create a question that SHOULD be archived (stuck for 11 mins)
    const qStuck = await prisma.question.create({
      data: {
        title: 'Stuck Question',
        module: QuestionModule.players,
        status: QuestionStatus.archiving,
        difficulty: Difficulty.easy,
        answerCount: 5,
        createdBy: 'archive_test_admin',
        updatedAt: elevenMinutesAgo,
      }
    });

    // 2. Create a question that SHOULD NOT be archived yet (only 5 mins)
    const qWaiting = await prisma.question.create({
      data: {
        title: 'Waiting Question',
        module: QuestionModule.players,
        status: QuestionStatus.archiving,
        difficulty: Difficulty.easy,
        answerCount: 5,
        createdBy: 'archive_test_admin',
        updatedAt: fiveMinutesAgo,
      }
    });

    // 3. Manually run the cleanup function captured from cron
    await cleanupFn();

    // 4. Verify results
    const archivedQ = await prisma.question.findUnique({ where: { id: qStuck.id } });
    const waitingQ = await prisma.question.findUnique({ where: { id: qWaiting.id } });

    expect(archivedQ?.status).toBe(QuestionStatus.archived);
    expect(archivedQ?.archivedAt).toBeDefined();
    
    expect(waitingQ?.status).toBe(QuestionStatus.archiving);
    expect(waitingQ?.archivedAt).toBeNull();
  });
});
