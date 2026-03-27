// src/modules/admin/users/admin-users.service.ts
import { prisma } from '../../../config/database';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../../errors/api-error';

export const adminUsersService = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    suspicious?: boolean;
  }) => {
    const { page = 1, limit = 20, search, suspicious } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(search ? {
        OR: [
          { nickname: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      } : {}),
      ...(suspicious ? {
        gameSessions: { some: { flagSuspicious: true } }
      } : {})
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nickname: true,
          email: true,
          countryCode: true,
          subscriptionTier: true,
          isBanned: true,
          banSuggested: true,
          createdAt: true,
          _count: {
            select: { gameSessions: { where: { flagSuspicious: true } } }
          }
        }
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items: items.map(user => ({
        ...user,
        flagSuspicious: user._count.gameSessions > 0,
        totalScore: 0, // Computed field, normally would join or aggregate
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getById: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        gameSessions: {
          where: { flagSuspicious: true },
          select: {
            id: true,
            submittedAt: true,
            suspiciousReason: true
          },
          orderBy: { submittedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!user) throw ApiError.notFound('Kullanıcı bulunamadı');
    return user;
  },

  getFlagged: async () => {
    return prisma.user.findMany({
      where: {
        OR: [
          { banSuggested: true },
          { gameSessions: { some: { flagSuspicious: true } } }
        ]
      },
      take: 20
    });
  },

  suggestBan: async (userId: string, adminId: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: {
        banSuggested: true,
        banSuggestedBy: adminId,
        banSuggestedAt: new Date()
      }
    });
  },

  ban: async (userId: string, reason?: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        // banReason logic can be added to schema if needed
      }
    });
  },

  unban: async (userId: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        banSuggested: false
      }
    });
  },
};
