import { QuestionModule } from '@prisma/client';
import { redis } from '../../config/redis';
import { redisKeys } from '../../utils/redis-keys.util';
import { ApiError } from '../../errors/api-error';
import { ErrorCode } from '../../errors/error-codes';
import { prisma } from '../../config/database';

export class LeaderboardService {
  /**
   * Adds a score to all applicable Redis leaderboard keys.
   */
  public async addScore(params: {
    userId: string;
    score: number;
    module: QuestionModule;
    countryCode?: string;
    isSpecial?: boolean;
    specialEventId?: string;
  }) {
    const { userId, score, module, countryCode, isSpecial, specialEventId } = params;
    const now = new Date();
    
    // Period keys
    const isoWeek = this.getISOWeek(now);
    const yearMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const yearQuarter = `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;

    const periods = [
      'alltime',
      `weekly:${isoWeek}`,
      `monthly:${yearMonth}`,
      `quarterly:${yearQuarter}`,
    ];

    const scopes = ['global'];
    if (countryCode && countryCode.toUpperCase() === 'TR') {
      scopes.push('tr');
    }

    const multi = redis.multi();

    for (const scope of scopes) {
      for (const period of periods) {
        // 1. Global/TR Score (Total)
        multi.zadd(redisKeys.leaderboard(scope, period), 'INCR', score, userId);
        
        // 2. Module specific Score
        multi.zadd(redisKeys.leaderboard(scope, period, module.toLowerCase()), 'INCR', score, userId);
      }
    }

    // 3. Special Event Score
    if (isSpecial && specialEventId) {
      multi.zadd(`leaderboard:special:${specialEventId}:global`, 'INCR', score, userId);
    }

    await multi.exec();
  }

  /**
   * Fetches the top users for a specific leaderboard.
   */
  public async getLeaderboard(params: {
    scope: string;
    period: string;
    module?: string;
    limit?: number;
  }) {
    const { scope, period, module, limit = 100 } = params;
    const key = redisKeys.leaderboard(scope, period, module);
    
    const topMembers = await redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');
    
    // Result is [id, score, id, score, ...]
    const rankings = [];
    for (let i = 0; i < topMembers.length; i += 2) {
      const userId = topMembers[i];
      const score = parseInt(topMembers[i+1]);
      rankings.push({ userId, score });
    }

    if (rankings.length === 0) return [];

    // Fetch nicknames and avatars from DB
    const users = await prisma.user.findMany({
      where: { id: { in: rankings.map(r => r.userId) } },
      select: { id: true, nickname: true, avatarIndex: true, countryCode: true },
    });

    return rankings.map((r, index) => {
      const user = users.find(u => u.id === r.userId);
      return {
        rank: index + 1,
        userId: r.userId,
        nickname: user?.nickname || 'Unknown',
        avatarIndex: user?.avatarIndex || 0,
        countryCode: user?.countryCode || 'XX',
        score: r.score,
      };
    });
  }

  /**
   * Fetches a specific user's rank and score.
   */
  public async getUserRank(userId: string, params: {
    scope: string;
    period: string;
    module?: string;
  }) {
    const { scope, period, module } = params;
    const key = redisKeys.leaderboard(scope, period, module);

    const score = await redis.zscore(key, userId);
    if (score === null) return null;

    const rank = await redis.zrevrank(key, userId);
    const totalParticipants = await redis.zcard(key);

    return {
      userId,
      rank: rank !== null ? rank + 1 : null,
      score: parseInt(score),
      totalParticipants,
    };
  }

  /**
   * Helper to get ISO Week (yyyy-Www)
   */
  private getISOWeek(d: Date): string {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
  }
}

export default new LeaderboardService();
