// src/modules/admin/app-config/admin-app-config.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';

export const adminAppConfigController = {
  get: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const config = await prisma.appConfig.findFirst({
        where: { id: 1 }
      });
      res.json({ status: 'success', data: config });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config = await prisma.appConfig.upsert({
        where: { id: 1 },
        update: req.body,
        create: { id: 1, ...req.body }
      });
      res.json({ status: 'success', data: config });
    } catch (error) {
      next(error);
    }
  }
};
