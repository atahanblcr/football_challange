// src/modules/admin/stats/admin-stats.controller.ts
import { Request, Response, NextFunction } from 'express';
import { adminStatsService } from './admin-stats.service';

export const adminStatsController = {
  getDashboard: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await adminStatsService.getDashboardStats();
      res.status(200).json({ status: 'success', data: stats });
    } catch (error) {
      next(error);
    }
  }
};
