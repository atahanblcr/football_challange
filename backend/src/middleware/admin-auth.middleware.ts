// src/middleware/admin-auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { jwtUtil } from '../utils/jwt.util';
import { ApiError } from '../errors/api-error';
import { ErrorCode } from '../errors/error-codes';
import { prisma } from '../config/database';

/**
 * Admin Session Token doğrulaması yapar ve admin kullanıcısını request nesnesine ekler.
 * Token 'x-admin-session' header'ından okunur.
 */
export const adminAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const sessionToken = req.headers['x-admin-session'] as string;

    if (!sessionToken) {
      throw ApiError.unauthorized(ErrorCode.UNAUTHORIZED, 'Admin oturumu bulunamadı');
    }

    const decoded = jwtUtil.verifyAdminSessionToken(sessionToken);

    // Admin kullanıcısını veritabanından çek
    const admin = await prisma.adminUser.findUnique({
      where: { id: decoded.adminId },
      select: { id: true, email: true, role: true, isActive: true }
    });

    if (!admin) {
      throw ApiError.unauthorized(ErrorCode.UNAUTHORIZED, 'Admin bulunamadı');
    }

    if (!admin.isActive) {
      throw ApiError.forbidden('Admin hesabınız devre dışı bırakılmıştır');
    }

    // Request nesnesine admin bilgisini ekle
    (req as any).admin = admin;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(ApiError.unauthorized(ErrorCode.TOKEN_EXPIRED, 'Admin oturum süresi doldu'));
    } else if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.unauthorized(ErrorCode.UNAUTHORIZED, 'Geçersiz admin oturumu'));
    }
  }
};
