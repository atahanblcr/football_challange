// src/modules/admin/events/admin-events.controller.ts
import { Request, Response, NextFunction } from 'express';
import { adminEventsService } from './admin-events.service';

export const adminEventsController = {
  getAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const events = await adminEventsService.getAll();
      res.status(200).json({ status: 'success', data: events });
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await adminEventsService.create(req.body);
      res.status(201).json({ status: 'success', data: event });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const event = await adminEventsService.update(id, req.body);
      res.status(200).json({ status: 'success', data: event });
    } catch (error) {
      next(error);
    }
  },

  activate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const event = await adminEventsService.activate(id);
      res.status(200).json({ status: 'success', data: event });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await adminEventsService.delete(id);
      res.status(200).json({ status: 'success', message: 'Etkinlik silindi' });
    } catch (error) {
      next(error);
    }
  },
};
