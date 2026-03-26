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
    answers: z.array(z.string()).min(1),
  })
});

export const adRewardSchema = z.object({
  params: z.object({
    id: z.string(),
  })
});

export type SubmitSessionInput = z.infer<typeof submitSessionSchema>['body'];
