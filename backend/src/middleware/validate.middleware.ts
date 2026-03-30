// src/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

/**
 * Zod şemalarını kullanarak request body, query ve params doğrulaması yapar.
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      console.error('Validation Error Details:', JSON.stringify(error, null, 2));
      console.error('Request Body:', JSON.stringify(req.body, null, 2));
      next(error);
    }
  };
};
