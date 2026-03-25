// src/modules/users/users.schema.ts
import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    nickname: z.string()
      .min(3, 'Nickname en az 3 karakter olmalıdır')
      .max(20, 'Nickname en fazla 20 karakter olmalıdır')
      .regex(/^[a-zA-Z0-9_]+$/, 'Nickname sadece harf, rakam ve alt çizgi içerebilir')
      .optional(),
    avatarIndex: z.number().int().min(0).max(50).optional(),
    countryCode: z.string().length(2, 'Geçersiz ülke kodu').optional(),
  })
});

export const checkNicknameSchema = z.object({
  params: z.object({
    nickname: z.string().min(1, 'Nickname zorunludur'),
  })
});
