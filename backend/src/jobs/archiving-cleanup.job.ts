import cron from 'node-cron';
import { prisma } from '../config/database';
import { QuestionStatus } from '@prisma/client';

/**
 * archiving-cleanup Job
 * Her 10 dakikada bir çalışır.
 * 'archiving' durumunda olan ve 10 dakikadan uzun süredir bu durumda bekleyen
 * soruları 'archived' durumuna çeker.
 */
export const archivingCleanupJob = () => {
  // Her 10 dakikada bir: "*/10 * * * *"
  cron.schedule('*/10 * * * *', async () => {
    console.log('[Job] Archiving cleanup started...');
    
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      const toArchive = await prisma.question.findMany({
        where: {
          status: QuestionStatus.archiving,
          updatedAt: { lte: tenMinutesAgo },
        },
        select: { id: true },
      });

      if (toArchive.length === 0) {
        console.log('[Job] No questions to cleanup from archiving.');
        return;
      }

      const ids = toArchive.map((q) => q.id);

      await prisma.question.updateMany({
        where: {
          id: { in: ids },
        },
        data: {
          status: QuestionStatus.archived,
          archivedAt: new Date(),
        },
      });

      console.log(`[Job] Cleaned up ${ids.length} archiving questions to archived.`);
    } catch (error) {
      console.error('[Job] Archiving cleanup failed:', error);
    }
  });
};
