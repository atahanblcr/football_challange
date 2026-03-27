// src/middleware/rbac.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/api-error';
import { ErrorCode } from '../errors/error-codes';
import { AdminRole } from '@prisma/client';

/**
 * Admin rolünü kontrol eder.
 * @param minRole Gereken minimum rol seviyesi
 */
export const rbacMiddleware = (minRole: AdminRole) => {
  const roleLevels: Record<AdminRole, number> = {
    super_admin: 3,
    editor: 2,
    moderator: 1
  };

  return (req: Request, _res: Response, next: NextFunction) => {
    const admin = (req as any).admin;

    if (!admin) {
      return next(ApiError.unauthorized(ErrorCode.UNAUTHORIZED, 'Admin oturumu bulunamadı'));
    }

    const adminRole = admin.role as AdminRole;

    if (roleLevels[adminRole] < roleLevels[minRole]) {
      return next(ApiError.forbidden('Bu işlem için yetkiniz yok'));
    }

    next();
  };
};
