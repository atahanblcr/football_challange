// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { jwtUtil } from '../utils/jwt.util';
import { ApiError } from '../errors/api-error';
import { ErrorCode } from '../errors/error-codes';
import { prisma } from '../config/database';

/**
 * JWT Access Token doğrulaması yapar ve kullanıcıyı request nesnesine ekler.
 * Ayrıca kullanıcının banlı olup olmadığını kontrol eder.
 */
export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized(ErrorCode.UNAUTHORIZED, 'Token bulunamadı');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwtUtil.verifyAccessToken(token);

    // Kullanıcıyı veritabanından çek ve ban kontrolü yap
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isBanned: true, subscriptionTier: true }
    });

    if (!user) {
      throw ApiError.unauthorized(ErrorCode.UNAUTHORIZED, 'Kullanıcı bulunamadı');
    }

    if (user.isBanned) {
      throw ApiError.forbidden('Hesabınız askıya alınmıştır');
    }

    // Request nesnesine kullanıcı bilgisini ekle (Express tip tanımlaması gerekebilir)
    (req as any).user = user;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(ApiError.unauthorized(ErrorCode.TOKEN_EXPIRED, 'Token süresi doldu'));
    } else if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.unauthorized(ErrorCode.UNAUTHORIZED, 'Geçersiz token'));
    }
  }
};
