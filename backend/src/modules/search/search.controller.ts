// src/modules/search/search.controller.ts
import { Request, Response, NextFunction } from 'express';
import { SearchService } from './search.service';

const searchService = new SearchService();

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, type } = req.query;

      if (!q || !type) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'q ve type parametreleri zorunludur' }
        });
      }

      const results = await searchService.searchEntities(q as string, type as string);
      res.json({ status: 'success', data: results });
    } catch (error) {
      next(error);
    }
  }
}
 
