// src/modules/admin/entities/admin-entities.schema.ts
import { z } from 'zod';
import { EntityType } from '@prisma/client';

export const adminEntitiesSchema = {
  create: z.object({
    body: z.object({
      name: z.string().min(1).max(100),
      nameTr: z.string().max(100).optional(),
      type: z.nativeEnum(EntityType),
      countryCode: z.string().length(2).optional(),
      alias: z.array(z.string()).optional(),
      imagePath: z.string().max(255).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  update: z.object({
    body: z.object({
      name: z.string().min(1).max(100).optional(),
      nameTr: z.string().max(100).optional(),
      type: z.nativeEnum(EntityType).optional(),
      countryCode: z.string().length(2).optional(),
      alias: z.array(z.string()).optional(),
      imagePath: z.string().max(255).optional(),
      isActive: z.boolean().optional(),
    }),
  }),
};
