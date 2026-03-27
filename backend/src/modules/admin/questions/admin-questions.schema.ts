// src/modules/admin/questions/admin-questions.schema.ts
import { z } from 'zod';
import { Difficulty, QuestionModule, QuestionStatus } from '@prisma/client';

const answerSchema = z.object({
  entityId: z.string().cuid().or(z.string()), // Accept cuid or any string as ID
  rank: z.number().int().min(1),
  statValue: z.string().min(1),
  statDisplay: z.string().optional().nullable(),
});

export const adminQuestionsSchema = {
  create: z.object({
    body: z.object({
      title: z.string().min(1).max(300),
      module: z.nativeEnum(QuestionModule),
      category: z.string().max(100).optional().nullable(),
      difficulty: z.nativeEnum(Difficulty),
      basePoints: z.number().int().min(0).default(100),
      timeLimit: z.number().int().min(10).default(60),
      status: z.nativeEnum(QuestionStatus).default(QuestionStatus.draft),
      isSpecial: z.boolean().default(false),
      specialEventId: z.string().optional().nullable(),
      scheduledFor: z.string().datetime().optional().nullable(),
      answers: z.array(answerSchema).min(1),
    }),
  }),

  update: z.object({
    body: z.object({
      title: z.string().min(1).max(300).optional(),
      module: z.nativeEnum(QuestionModule).optional(),
      category: z.string().max(100).optional().nullable(),
      difficulty: z.nativeEnum(Difficulty).optional(),
      basePoints: z.number().int().min(0).optional(),
      timeLimit: z.number().int().min(10).optional(),
      status: z.nativeEnum(QuestionStatus).optional(),
      isSpecial: z.boolean().optional(),
      specialEventId: z.string().optional().nullable(),
      scheduledFor: z.string().datetime().optional().nullable(),
      answers: z.array(answerSchema).min(1).optional(),
    }),
  }),
};
