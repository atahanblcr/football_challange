// src/modules/admin/entities/admin-entities.service.ts
import { prisma } from '../../../config/database';
import { EntityType, Prisma } from '@prisma/client';
import { ApiError } from '../../../errors/api-error';
import { normalizeText } from '../../../utils/normalize-text.util';

export const adminEntitiesService = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    type?: EntityType;
    search?: string;
  }) => {
    const { page = 1, limit = 20, type, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.EntityWhereInput = {
      ...(type ? { type } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { alias: { has: search } }
        ]
      } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.entity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { questionAnswers: true }
          }
        }
      }),
      prisma.entity.count({ where }),
    ]);

    return {
      items: items.map(item => ({
        ...item,
        questionCount: item._count.questionAnswers
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  search: async (query: string, type?: EntityType) => {
    if (!query || query.length < 2) return [];

    const normalized = normalizeText(query);

    // SQL raw query for FTS-like behavior (ILike for simplicity or full-text)
    // Here we use Prisma findMany for easier type safety, but we can use $queryRaw if needed.
    return prisma.entity.findMany({
      where: {
        ...(type ? { type } : {}),
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { alias: { hasSome: [query] } }
        ]
      },
      take: 8,
      orderBy: { name: 'asc' }
    });
  },

  checkDuplicate: async (name: string) => {
    if (!name || name.length < 3) return [];

    return prisma.entity.findMany({
      where: {
        name: { contains: name, mode: 'insensitive' }
      },
      select: {
        id: true,
        name: true,
        type: true
      },
      take: 5
    });
  },

  create: async (data: Prisma.EntityCreateInput) => {
    return prisma.entity.create({
      data
    });
  },

  update: async (id: string, data: Prisma.EntityUpdateInput) => {
    return prisma.entity.update({
      where: { id },
      data
    });
  },

  delete: async (id: string) => {
    // Kaç soruda kullanıldığını kontrol et
    const usageCount = await prisma.questionAnswer.count({
      where: { entityId: id }
    });

    if (usageCount > 0) {
      throw ApiError.badRequest(`Bu entity ${usageCount} soruda kullanılıyor. Önce sorulardan çıkarılmalı veya soru silinmeli.`);
    }

    return prisma.entity.delete({
      where: { id }
    });
  },
};
