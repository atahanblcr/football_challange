// src/modules/admin/users/admin-users.controller.ts
import { Request, Response, NextFunction } from 'express';
import { adminUsersService } from './admin-users.service';

export const adminUsersController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, suspicious } = req.query;
      const result = await adminUsersService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        suspicious: suspicious === 'true'
      });
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await adminUsersService.getById(id);
      res.status(200).json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  },

  getFlagged: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await adminUsersService.getFlagged();
      res.status(200).json({ status: 'success', data: users });
    } catch (error) {
      next(error);
    }
  },

  suggestBan: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const admin = (req as any).admin;
      await adminUsersService.suggestBan(id, admin.id);
      res.status(200).json({ status: 'success', message: 'Ban önerisi iletildi' });
    } catch (error) {
      next(error);
    }
  },

  ban: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      await adminUsersService.ban(id, reason);
      res.status(200).json({ status: 'success', message: 'Kullanıcı banlandı' });
    } catch (error) {
      next(error);
    }
  },

  unban: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await adminUsersService.unban(id);
      res.status(200).json({ status: 'success', message: 'Kullanıcı banı kaldırıldı' });
    } catch (error) {
      next(error);
    }
  },
};
