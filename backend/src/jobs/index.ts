import { dailyLimitResetJob } from './daily-limit-reset.job';
import { dailyQuestionSelectorJob } from './daily-question-selector.job';
import { cooldownCleanupJob } from './cooldown-cleanup.job';
import { poolHealthCheckJob } from './pool-health-check.job';
import { leaderboardArchiverJob } from './leaderboard-archiver.job';
import { suspiciousFlagReportJob } from './suspicious-flag-report.job';
import { archivingCleanupJob } from './archiving-cleanup.job';

/**
 * Tüm zamanlanmış görevleri (Cron Jobs) başlatır.
 */
export const startAllJobs = () => {
  dailyLimitResetJob();
  dailyQuestionSelectorJob();
  cooldownCleanupJob();
  poolHealthCheckJob();
  leaderboardArchiverJob();
  suspiciousFlagReportJob();
  archivingCleanupJob();
};
