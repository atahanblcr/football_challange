import { Request, Response, NextFunction } from 'express';
import QuestionService from './questions.service';

export class QuestionController {
  /**
   * GET /api/v1/questions/daily
   */
  public async getDailyQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const questions = await QuestionService.getDailyQuestions();
      res.json(questions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/questions/:id/meta
   */
  public async getQuestionMeta(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const meta = await QuestionService.getQuestionMeta(id);
      res.json(meta);
    } catch (error) {
      next(error);
    }
  }
}

export default new QuestionController();
