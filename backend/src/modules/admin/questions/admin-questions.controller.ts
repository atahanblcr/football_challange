// src/modules/admin/questions/admin-questions.controller.ts
import { Request, Response, NextFunction } from 'express';
import { adminQuestionsService } from './admin-questions.service';
import { QuestionModule, QuestionStatus } from '@prisma/client';

export const adminQuestionsController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, module, status, search } = req.query;
      const result = await adminQuestionsService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        module: module as QuestionModule,
        status: status as QuestionStatus,
        search: search as string,
      });
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const question = await adminQuestionsService.getById(id);
      res.status(200).json({ status: 'success', data: question });
    } catch (error) {
      next(error);
    }
  },

  getPoolHealth: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await adminQuestionsService.getPoolHealth();
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  },

  getCalendar: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { month, year } = req.query;
      const result = await adminQuestionsService.getCalendar(
        month ? Number(month) : undefined,
        year ? Number(year) : undefined
      );
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  },

  getAssignmentsByDate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date } = req.query;
      const result = await adminQuestionsService.getAssignmentsByDate(date as string);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  },

  triggerAutoAssignment: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await adminQuestionsService.prefillAssignments(7);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  },

  assignManual: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date, module, questionId, isSpecial } = req.body;
      const result = await adminQuestionsService.assignManual(date, module, questionId, isSpecial);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  },

  assignRandom: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date, module, isSpecial } = req.body;
      const result = await adminQuestionsService.assignRandom(date, module, isSpecial);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const admin = (req as any).admin;
      const question = await adminQuestionsService.create({
        ...req.body,
        createdBy: admin.id,
      });
      res.status(201).json({ status: 'success', data: question });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const question = await adminQuestionsService.update(id, req.body);
      res.status(200).json({ status: 'success', data: question });
    } catch (error) {
      next(error);
    }
  },

  archive: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const status = await adminQuestionsService.archive(id);
      res.status(200).json({ status: 'success', data: { status } });
    } catch (error) {
      next(error);
    }
  },
};
