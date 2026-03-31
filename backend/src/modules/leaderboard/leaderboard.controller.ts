import { Request, Response, NextFunction } from 'express';
import LeaderboardService from './leaderboard.service';

export class LeaderboardController {
  /**
   * GET /api/v1/leaderboard
   */
  public async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { scope, period, module, limit } = req.query;
      const userId = (req as any).user?.id;
      
      const rankings = await LeaderboardService.getLeaderboard({
        scope: scope as string,
        period: period as string,
        module: module as string,
        limit: limit ? parseInt(limit as string) : 100,
      });

      // Also fetch my rank for the "myEntry" field if userId exists
      let myEntry = null;
      if (userId) {
        myEntry = await LeaderboardService.getUserRank(userId, {
          scope: scope as string,
          period: period as string,
          module: module as string,
        });
      }

      res.json({
        status: 'success',
        data: {
          items: rankings,
          totalCount: rankings.length, // MVP: using length for now
          myEntry: myEntry
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/leaderboard/me
   */
  public async getMyRank(req: Request, res: Response, next: NextFunction) {
    try {
      const { scope, period, module } = req.query;
      const userId = (req as any).user!.id;

      const rank = await LeaderboardService.getUserRank(userId, {
        scope: scope as string,
        period: period as string,
        module: module as string,
      });

      res.json({
        status: 'success',
        data: rank
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new LeaderboardController();
