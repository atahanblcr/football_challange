// src/middleware/rbac.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/api-error';
import { AdminRole } from '@prisma/client';

/**
 * Rol tabanlı yetkilendirme (RBAC) middleware'i.
 * Belirli rollerin belirli endpoint'lere erişimini kısıtlar.
 */
export const rbacMiddleware = (allowedRoles: AdminRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Admin yetkisi için 'adminUser' request nesnesinde olmalı (AdminAuthMiddleware tarafından eklenir)
    const admin = (req as any).adminUser;

    if (!admin) {
      return next(ApiError.unauthorized());
    }

    if (!allowedRoles.includes(admin.role)) {
      return next(ApiError.forbidden('Bu işlem için yetkiniz yetersiz'));
    }

    next();
  };
};
