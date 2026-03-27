// src/modules/admin/events/admin-events.service.ts
import { prisma } from '../../../config/database';
import { Prisma } from '@prisma/client';

export const adminEventsService = {
  getAll: async () => {
    return prisma.specialEvent.findMany({
      orderBy: { startsAt: 'desc' },
      include: {
        _count: { select: { questions: true } }
      }
    });
  },

  create: async (data: Prisma.SpecialEventCreateInput) => {
    return prisma.specialEvent.create({
      data
    });
  },

  update: async (id: string, data: Prisma.SpecialEventUpdateInput) => {
    return prisma.specialEvent.update({
      where: { id },
      data
    });
  },

  activate: async (id: string) => {
    return prisma.$transaction(async (tx) => {
      // Önce diğerlerini pasife al
      await tx.specialEvent.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      // Seçileni aktif et
      return tx.specialEvent.update({
        where: { id },
        data: { isActive: true }
      });
    });
  },

  delete: async (id: string) => {
    return prisma.specialEvent.delete({
      where: { id }
    });
  },
};
