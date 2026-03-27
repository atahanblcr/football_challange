// src/modules/app-config/app-config.controller.ts
import { Request, Response, NextFunction } from 'express';
import { appConfigService } from './app-config.service';

export const appConfigController = {
  getConfig: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const config = await appConfigService.getConfig();
      res.status(200).json({ status: 'success', data: config });
    } catch (error) {
      next(error);
    }
  }
};
