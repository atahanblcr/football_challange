// src/modules/admin/admins/admin-admins.service.ts
import { prisma } from '../../../config/database';
import { bcryptUtil } from '../../../utils/bcrypt.util';
import { jwtUtil } from '../../../utils/jwt.util';
import { ApiError } from '../../../errors/api-error';
import { ErrorCode } from '../../../errors/error-codes';
import { AdminRole, AdminUser } from '@prisma/client';

export const adminAdminsService = {
  login: async (email: string, password: string) => {
    const admin = await prisma.adminUser.findUnique({
      where: { email }
    });

    if (!admin) {
      throw ApiError.unauthorized(ErrorCode.INVALID_CREDENTIALS, 'Geçersiz e-posta veya şifre');
    }

    if (!admin.isActive) {
      throw ApiError.forbidden('Admin hesabınız devre dışı bırakılmıştır');
    }

    const isPasswordValid = await bcryptUtil.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw ApiError.unauthorized(ErrorCode.INVALID_CREDENTIALS, 'Geçersiz e-posta veya şifre');
    }

    const sessionToken = jwtUtil.generateAdminSessionToken({
      adminId: admin.id,
      role: admin.role
    });

    return {
      sessionToken,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    };
  },

  getAll: async () => {
    return prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  create: async (data: { email: string; passwordHash: string; role: AdminRole }) => {
    const existing = await prisma.adminUser.findUnique({
      where: { email: data.email }
    });

    if (existing) {
      throw ApiError.conflict(ErrorCode.EMAIL_TAKEN, 'Bu e-posta adresi zaten kullanımda');
    }

    const hashedPassword = await bcryptUtil.hash(data.passwordHash);

    return prisma.adminUser.create({
      data: {
        ...data,
        passwordHash: hashedPassword
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    });
  },

  update: async (id: string, data: Partial<AdminUser>) => {
    if (data.passwordHash) {
      data.passwordHash = await bcryptUtil.hash(data.passwordHash);
    }

    return prisma.adminUser.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    });
  },

  delete: async (id: string) => {
    // Son super_admin silinmemeli kontrolü eklenebilir
    const superAdminCount = await prisma.adminUser.count({
      where: { role: AdminRole.super_admin, isActive: true }
    });

    const adminToDelete = await prisma.adminUser.findUnique({ where: { id } });

    if (adminToDelete?.role === AdminRole.super_admin && superAdminCount <= 1) {
      throw ApiError.forbidden('Sistemdeki son aktif süper admini silemezsiniz');
    }

    return prisma.adminUser.delete({
      where: { id }
    });
  }
};
