import { z } from 'zod';

export const startSessionSchema = z.object({
  params: z.object({
    id: z.string(),
  })
});

export const submitSessionSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    answers: z.array(z.string()).optional(),
    entityIds: z.array(z.string()).optional(),
  })
});

export const adRewardSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    adToken: z.string().min(1, 'Reklam tokenı gereklidir'),
  })
});

export type SubmitSessionInput = z.infer<typeof submitSessionSchema>['body'];
