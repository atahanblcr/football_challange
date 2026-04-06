import cron from 'node-cron';
import { logger } from '../utils/logger.util';
import { adminQuestionsService } from '../modules/admin/questions/admin-questions.service';

/**
 * daily_question_selector (Bölüm 13)
 * Zamanlama: Her gün 00:05 (UTC+3)
 */
export const dailyQuestionSelectorJob = () => {
  cron.schedule('5 0 * * *', async () => {
    logger.info('[Job] Daily question selector cron triggered.');
    try {
      await adminQuestionsService.prefillAssignments(7);
      logger.info('[Job] Daily question selector completed.');
    } catch (error) {
      logger.error('[Job] Daily question selector failed:', error);
    }
  }, {
    timezone: "Europe/Istanbul"
  });
};
