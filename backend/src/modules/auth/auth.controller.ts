// src/modules/auth/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.googleLogin(req.body.idToken);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.refresh(req.body.refreshToken);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, _next: NextFunction) {
    // Refresh token blacklist mantığı eklenebilir. 
    // MVP'de client-side token silme yeterli.
    res.json({ status: 'success', message: 'Başarıyla çıkış yapıldı' });
  }
}
