// src/modules/users/users.controller.ts
import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';

const usersService = new UsersService();

export class UsersController {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getMe((req as any).user.id);
      res.json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateMe((req as any).user.id, req.body);
      res.json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  }

  async checkNickname(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.isNicknameAvailable(req.params.nickname);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const history = await usersService.getHistory((req as any).user.id);
      res.json({ status: 'success', data: history });
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      await usersService.deleteAccount((req as any).user.id);
      res.json({ status: 'success', message: 'Hesap başarıyla silindi' });
    } catch (error) {
      next(error);
    }
  }
}
