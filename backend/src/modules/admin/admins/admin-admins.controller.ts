// src/modules/admin/admins/admin-admins.controller.ts
import { Request, Response, NextFunction } from 'express';
import { adminAdminsService } from './admin-admins.service';

export const adminAdminsController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await adminAdminsService.login(email, password);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  },

  me: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const admin = (req as any).admin;
      res.status(200).json({ status: 'success', data: admin });
    } catch (error) {
      next(error);
    }
  },

  logout: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', message: 'Çıkış yapıldı' });
    } catch (error) {
      next(error);
    }
  },

  getAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const admins = await adminAdminsService.getAll();
      res.status(200).json({ status: 'success', data: admins });
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const admin = await adminAdminsService.create(req.body);
      res.status(201).json({ status: 'success', data: admin });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const admin = await adminAdminsService.update(id, req.body);
      res.status(200).json({ status: 'success', data: admin });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await adminAdminsService.delete(id);
      res.status(200).json({ status: 'success', message: 'Admin silindi' });
    } catch (error) {
      next(error);
    }
  }
};
