import { Request, Response, NextFunction } from 'express';
import SessionService from './sessions.service';

export class SessionController {
  /**
   * POST /api/v1/questions/:id/start
   */
  public async startSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: questionId } = req.params;
      const userId = (req as any).user!.id; // Authenticated user ID

      const session = await SessionService.startSession(userId, questionId);
      res.status(201).json({ data: session });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/sessions/:id/submit
   */
  public async submitSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: sessionId } = req.params;
      const { answers, entityIds } = req.body;
      const userId = (req as any).user!.id;

      // Hem 'answers' hem 'entityIds' (mobil) desteği
      const finalAnswers = answers || entityIds || [];

      const result = await SessionService.submitSession(userId, sessionId, finalAnswers);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/sessions/:id/result
   */
  public async getResult(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: sessionId } = req.params;
      const userId = (req as any).user!.id;

      const result = await SessionService.getSessionResult(userId, sessionId);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/sessions/:id/ad-reward
   */
  public async applyAdReward(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: sessionId } = req.params;
      const userId = (req as any).user!.id;

      const result = await SessionService.applyAdReward(userId, sessionId);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new SessionController();
