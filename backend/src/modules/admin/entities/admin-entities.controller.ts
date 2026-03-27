// src/modules/admin/entities/admin-entities.controller.ts
import { Request, Response, NextFunction } from 'express';
import { adminEntitiesService } from './admin-entities.service';
import { EntityType } from '@prisma/client';

export const adminEntitiesController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, type, search } = req.query;
      const result = await adminEntitiesService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        type: type as EntityType,
        search: search as string,
      });
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  },

  search: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q, type } = req.query;
      const result = await adminEntitiesService.search(q as string, type as EntityType);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  },

  checkDuplicate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.query;
      const result = await adminEntitiesService.checkDuplicate(name as string);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entity = await adminEntitiesService.create(req.body);
      res.status(201).json({ status: 'success', data: entity });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const entity = await adminEntitiesService.update(id, req.body);
      res.status(200).json({ status: 'success', data: entity });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await adminEntitiesService.delete(id);
      res.status(200).json({ status: 'success', message: 'Entity silindi' });
    } catch (error) {
      next(error);
    }
  },
};
