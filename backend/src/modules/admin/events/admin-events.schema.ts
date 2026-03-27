// src/modules/admin/events/admin-events.schema.ts
import { z } from 'zod';

export const adminEventsSchema = {
  create: z.object({
    body: z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional().nullable(),
      startsAt: z.string().datetime(),
      endsAt: z.string().datetime(),
      isActive: z.boolean().default(false),
    }),
  }),

  update: z.object({
    body: z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional().nullable(),
      startsAt: z.string().datetime().optional(),
      endsAt: z.string().datetime().optional(),
      isActive: z.boolean().optional(),
    }),
  }),
};
