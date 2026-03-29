// src/modules/auth/auth.schema.ts
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Geçersiz e-posta adresi'),
    password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
    nickname: z.string()
      .min(3, 'Nickname en az 3 karakter olmalıdır')
      .max(20, 'Nickname en fazla 20 karakter olmalıdır')
      .regex(/^[a-zA-Z0-9_]+$/, 'Nickname sadece harf, rakam ve alt çizgi içerebilir')
      .optional(),
    referredByCode: z.string().optional(),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Geçersiz e-posta adresi'),
    password: z.string().min(1, 'Şifre zorunludur'),
  })
});

export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'idToken zorunludur'),
  })
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'refreshToken zorunludur'),
  })
});
