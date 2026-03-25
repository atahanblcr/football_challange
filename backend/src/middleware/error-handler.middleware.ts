// src/middleware/error-handler.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../errors/api-error';

export function errorHandlerMiddleware(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ApiError instance kontrolü
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Zod Validation hataları
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Geçersiz istek verisi',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  console.error('Bilinmeyen hata:', err);

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Sunucu hatası oluştu',
    },
  });
}
