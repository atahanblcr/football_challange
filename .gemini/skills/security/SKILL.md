---
name: security
description: Specialized procedural guidance for security in the Football Challenge project.
---

# SKILL: GÜVENLİK — RATE LIMITING, HİLE TESPİTİ, INPUT VALIDATION, GENEL GÜVENLİK

> Bu skill dosyası Football Challenge'ın güvenlik katmanını tanımlar.
> Rate limiting, hile tespiti, input sanitizasyonu, API güvenliği ve
> genel hardening kuralları burada kesinleştirilmiştir.
> Güvenlik önlemleri atlanamaz ve gevşetilemez.

---

## 1. GÜVENLİK KATMANLARI ÖZETI

```
İstek → [Rate Limit] → [Helmet] → [CORS] → [Auth] → [Input Validation] → [İş Mantığı]
                                                              ↓
                                                    [Hile Tespiti]
                                                              ↓
                                                    [Merkezi Hata Handler]
```

---

## 2. HELMET — HTTP BAŞLIK GÜVENLİĞİ

```typescript
// src/app.ts içinde, diğer middleware'lerden önce

import helmet from 'helmet';

app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  // XSS koruması
  xssFilter: true,
  // Clickjacking önleme
  frameguard: { action: 'deny' },
  // MIME sniffing önleme
  noSniff: true,
  // HSTS (production'da zorunlu)
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  // Referrer bilgisi sınırlama
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

---

## 3. CORS YAPIPLANDIRMASI

```typescript
// src/app.ts

import cors from 'cors';

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Mobil uygulama, Postman, null origin — production'da sıkılaştırılabilir
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: İzin verilmeyen kaynak'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-session'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
}));
```

---

## 4. RATE LIMIT — TAM KONFİGÜRASYON

```typescript
// src/middleware/rate-limit.middleware.ts
import rateLimit, { Options } from 'express-rate-limit';
import { redis } from '../config/redis';
import { ApiError } from '../errors/api-error';

// Redis store — distributed rate limit (birden fazla instance için)
// Not: express-rate-limit için rate-limit-redis paketi kullanılır
import RedisStore from 'rate-limit-redis';

function makeStore(prefix: string) {
  return new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: `rl:${prefix}:`,
  });
}

function makeLimiter(opts: Partial<Options> & { prefix: string }) {
  const { prefix, ...rest } = opts;
  return rateLimit({
    standardHeaders: true,   // RateLimit-* başlıkları
    legacyHeaders: false,
    store: makeStore(prefix),
    handler: (_req, _res, next) => {
      next(ApiError.tooManyRequests());
    },
    ...rest,
  });
}

export const rateLimitMiddleware = {
  // Auth endpoint'leri — IP başına 10 istek / 15 dakika
  auth: makeLimiter({
    prefix: 'auth',
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.ip ?? 'unknown',
  }),

  // Admin giriş — IP başına 5 istek / 15 dakika (daha sıkı)
  adminLogin: makeLimiter({
    prefix: 'admin_login',
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => req.ip ?? 'unknown',
  }),

  // Arama — kullanıcı başına 20 istek / dakika
  search: makeLimiter({
    prefix: 'search',
    windowMs: 60 * 1000,
    max: 20,
    keyGenerator: (req) => (req as any).user?.id ?? req.ip ?? 'unknown',
  }),

  // Session submit — kullanıcı başına 30 istek / saat
  sessionSubmit: makeLimiter({
    prefix: 'submit',
    windowMs: 60 * 60 * 1000,
    max: 30,
    keyGenerator: (req) => (req as any).user?.id ?? req.ip ?? 'unknown',
  }),

  // Nickname kontrolü — kullanıcı başına 30 istek / dakika
  nicknameCheck: makeLimiter({
    prefix: 'nickname',
    windowMs: 60 * 1000,
    max: 30,
    keyGenerator: (req) => (req as any).user?.id ?? req.ip ?? 'unknown',
  }),

  // Ad reward — kullanıcı başına 10 istek / saat
  adReward: makeLimiter({
    prefix: 'ad_reward',
    windowMs: 60 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => (req as any).user?.id ?? req.ip ?? 'unknown',
  }),
};
```

---

## 5. HİLE TESPİTİ — DETAYLI KURALLAR

### 5.1 Zaman Bazlı Hile Tespiti (Mevcut)

```typescript
// src/modules/scoring/scoring.service.ts içinde

/**
 * KURAL: Toplam geçen süre < cevap sayısı × 4 saniye ise şüpheli
 *
 * Mantık: Her cevabı aramak ve seçmek için minimum 4 saniye gerekir.
 * 7 cevaplı soru için minimum süre = 7 × 4 = 28 saniye.
 * 28 saniyeden kısa sürede 7 cevap girilmesi insan için çok zordur.
 *
 * Bu kural ban vermez. Sadece flagSuspicious=true yapar.
 * Admin incelemesi gerektirir.
 */
isSuspicious(startedAt: Date, submittedAt: Date, answerCount: number): {
  suspicious: boolean;
  reason?: string;
} {
  const elapsedMs = submittedAt.getTime() - startedAt.getTime();
  const elapsedSeconds = elapsedMs / 1000;
  const minimumExpected = answerCount * 4; // MIN_SECONDS_PER_ANSWER = 4

  if (elapsedSeconds < minimumExpected) {
    return {
      suspicious: true,
      reason: `submitted_at - started_at = ${elapsedSeconds.toFixed(1)}s, ` +
               `minimum expected = ${minimumExpected}s for ${answerCount} answers`,
    };
  }

  return { suspicious: false };
}
```

### 5.2 Ek Hile Tespiti Kontrolleri (Session Submit Middleware)

```typescript
// src/middleware/cheat-detect.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger.util';

/**
 * Session submit isteğinde ek güvenlik kontrolleri:
 * 1. submitted_at - started_at < 0 (zaman manipülasyonu)
 * 2. Aynı sessionId ikinci kez submit (tekrar saldırısı) — service katmanında da kontrol edilir
 * 3. Payload boyutu aşımı — express.json limit ile önlenir
 * 4. entityIds listesi soru answerCount'tan fazla cevap içeriyor mu
 */
export async function cheatDetectMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { sessionId } = req.params;
    const { entityIds } = req.body;

    if (!sessionId || !Array.isArray(entityIds)) {
      return next();
    }

    // Oturumu çek
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { question: { select: { answerCount: true } } },
    });

    if (!session) return next();

    const now = new Date();
    const elapsedSeconds = (now.getTime() - session.startedAt.getTime()) / 1000;

    // Negatif süre — saat manipülasyonu
    if (elapsedSeconds < 0) {
      logger.warn({
        message: 'Hile tespiti: Negatif süre',
        sessionId,
        userId: session.userId,
        elapsedSeconds,
      });
      // Devam et — servis katmanı zaten handle eder
      // Ama flag için not bırak
      (req as any).suspiciousNote = 'negative_elapsed_time';
    }

    // Soru answerCount'tan fazla cevap
    if (entityIds.length > session.question.answerCount) {
      logger.warn({
        message: 'Hile tespiti: Fazla cevap sayısı',
        sessionId,
        userId: session.userId,
        submitted: entityIds.length,
        expected: session.question.answerCount,
      });
      // Fazla cevapları kes
      req.body.entityIds = entityIds.slice(0, session.question.answerCount);
    }

    // Duplicate entityId (aynı entity iki kez gönderilmiş)
    const uniqueIds = new Set(entityIds);
    if (uniqueIds.size !== entityIds.length) {
      logger.warn({
        message: 'Hile tespiti: Tekrarlı entity ID',
        sessionId,
        userId: session.userId,
      });
      req.body.entityIds = Array.from(uniqueIds);
    }

    next();
  } catch {
    next(); // Middleware hatası submit'i engellemez
  }
}
```

---

## 6. INPUT VALİDASYON — ZOD İLE KAPSAMLI

### 6.1 Genel Validation Kuralları

```typescript
// src/utils/validation.util.ts

import { z } from 'zod';

// UUID validation
export const uuidSchema = z.string().uuid('Geçersiz ID formatı');

// Sayfalama
export const paginationSchema = z.object({
  page:  z.string().transform(Number).pipe(z.number().int().min(0)).default('0'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('20'),
});

// Tarih aralığı
export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to:   z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.from && data.to) {
      return new Date(data.from) <= new Date(data.to);
    }
    return true;
  },
  { message: 'Başlangıç tarihi bitiş tarihinden sonra olamaz' }
);

// Ülke kodu
export const countryCodeSchema = z
  .string()
  .length(2)
  .regex(/^[A-Z]{2}$/, 'Geçersiz ülke kodu')
  .transform(s => s.toUpperCase());

// Nickname
export const nicknameSchema = z
  .string()
  .min(3, 'En az 3 karakter')
  .max(20, 'En fazla 20 karakter')
  .regex(/^[a-zA-Z0-9_]+$/, 'Sadece harf, rakam ve alt çizgi kullanılabilir')
  .refine(
    s => !s.startsWith('_') && !s.endsWith('_'),
    'Kullanıcı adı alt çizgi ile başlayamaz veya bitemez'
  );

// Arama sorgusu
export const searchQuerySchema = z
  .string()
  .min(2, 'En az 2 karakter')
  .max(50, 'En fazla 50 karakter')
  .trim()
  .transform(s => s.replace(/[<>"'`]/g, '')); // XSS karakterleri temizle

// Entity ID listesi (session submit)
export const entityIdsSchema = z
  .array(z.string().uuid())
  .min(0)
  .max(15); // Herhangi bir sorunun maksimum cevap sayısından fazla olamaz
```

### 6.2 Admin Panel Validation

```typescript
// src/modules/admin/questions/admin-questions.schema.ts

import { z } from 'zod';

export const createQuestionSchema = z.object({
  title: z
    .string()
    .min(10, 'Başlık en az 10 karakter')
    .max(300, 'Başlık en fazla 300 karakter')
    .trim(),

  module: z.enum(['players', 'clubs', 'nationals', 'managers']),
  category: z.string().max(100).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),

  basePoints: z
    .number()
    .int()
    .min(10, 'Baz puan en az 10')
    .max(500, 'Baz puan en fazla 500')
    .default(100),

  timeLimit: z
    .number()
    .int()
    .min(15, 'Süre en az 15 saniye')
    .max(180, 'Süre en fazla 180 saniye'),

  answers: z
    .array(z.object({
      entityId:    z.string().uuid(),
      rank:        z.number().int().min(1).max(20),
      statValue:   z.string().min(1).max(50).trim(),
      statDisplay: z.string().max(100).trim().optional(),
    }))
    .min(2, 'En az 2 cevap gerekli')
    .max(15, 'En fazla 15 cevap')
    .refine(
      (answers) => {
        // Rank'lar 1'den başlayıp ardışık olmalı
        const ranks = answers.map(a => a.rank).sort((a, b) => a - b);
        return ranks.every((r, i) => r === i + 1);
      },
      { message: 'Rank\'lar 1\'den başlayıp ardışık olmalı (1, 2, 3...)' }
    )
    .refine(
      (answers) => {
        // Aynı entity iki kez kullanılamaz
        const ids = answers.map(a => a.entityId);
        return new Set(ids).size === ids.length;
      },
      { message: 'Aynı entity iki kez kullanılamaz' }
    ),

  scheduledFor: z.string().datetime().optional(),
  isSpecial:    z.boolean().default(false),
  specialEventId: z.string().uuid().optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
```

### 6.3 Entity Validation

```typescript
// src/modules/admin/entities/admin-entities.schema.ts

import { z } from 'zod';

export const createEntitySchema = z.object({
  type: z.enum(['player', 'club', 'national', 'manager']),

  name: z
    .string()
    .min(2, 'En az 2 karakter')
    .max(100, 'En fazla 100 karakter')
    .trim(),

  nameTr: z
    .string()
    .max(100)
    .trim()
    .optional(),

  countryCode: z
    .string()
    .length(2)
    .regex(/^[A-Z]{2}$/)
    .optional()
    .transform(s => s?.toUpperCase()),

  alias: z
    .array(z.string().max(100).trim())
    .max(10, 'En fazla 10 alias')
    .default([]),

  imagePath: z
    .string()
    .max(255)
    .regex(/^[a-zA-Z0-9/_.-]+$/, 'Geçersiz dosya yolu karakterleri')
    .optional(),
});

export type CreateEntityInput = z.infer<typeof createEntitySchema>;
```

---

## 7. SQL INJECTION KORUNMASI

```typescript
/**
 * Prisma ORM parametreli sorgular kullandığı için SQL injection
 * otomatik olarak önlenir. Ancak $queryRaw kullanıldığında
 * her zaman Prisma.sql tag'i veya parametre binding kullanılır.
 */

// ❌ YANLIŞ — SQL injection riski
const results = await prisma.$queryRawUnsafe(
  `SELECT * FROM "Entity" WHERE name = '${userInput}'`
);

// ✅ DOĞRU — Prisma parametreli sorgu
const results = await prisma.$queryRaw`
  SELECT * FROM "Entity"
  WHERE normalize_turkish(name) ILIKE ${'%' + normalizedInput + '%'}
  LIMIT ${6}
`;

// ✅ DOĞRU — Template literal otomatik escape
const term = `%${userInput.replace(/[%_]/g, '\\$&')}%`; // LIKE özel karakterlerini escape et
const results = await prisma.$queryRaw`
  SELECT * FROM "Entity"
  WHERE name ILIKE ${term}
`;
```

---

## 8. PAYLOAD BOYUTU SINIRLAMASI

```typescript
// src/app.ts

// JSON body limit — büyük payload saldırısı önleme
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Dosya yükleme endpoint'leri için ayrı limit (entity görseli)
// multer veya formidable ile yapılır, limit: 2MB
```

---

## 9. TOKEN GÜVENLİĞİ KONTROL LİSTESİ

```typescript
// src/middleware/auth.middleware.ts içinde ek kontroller

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    // 1. Authorization header varlık kontrolü
    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('TOKEN_MISSING');
    }

    const token = authHeader.slice(7);

    // 2. Token uzunluk kontrolü (çok kısa veya çok uzun tokenlar geçersiz)
    if (token.length < 50 || token.length > 2000) {
      throw ApiError.unauthorized('TOKEN_MALFORMED');
    }

    // 3. JWT formatı kontrolü (3 parça, nokta ile ayrılmış)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw ApiError.unauthorized('TOKEN_MALFORMED');
    }

    // 4. Token doğrulama
    const payload = verifyAccessToken(token);

    // 5. Token tipinin 'access' olduğunu kontrol et
    if (payload.type !== 'access') {
      throw ApiError.unauthorized('WRONG_TOKEN_TYPE');
    }

    // 6. Token revoke kontrolü (güvenlik ihlali sonrası)
    const revokeKey = `revoked:user:${payload.sub}`;
    const revokedAt = await redis.get(revokeKey);
    if (revokedAt) {
      // Token, revoke zamanından önce mi üretildi?
      // JWT iat (issued at) claim ile karşılaştır
      const jwtPayload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString()
      );
      if (jwtPayload.iat && jwtPayload.iat * 1000 < parseInt(revokedAt)) {
        throw ApiError.unauthorized('TOKEN_REVOKED');
      }
    }

    // 7. Kullanıcı varlık ve ban kontrolü
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isBanned: true, subscriptionTier: true },
    });

    if (!user) throw ApiError.unauthorized('USER_NOT_FOUND');
    if (user.isBanned) {
      throw new ApiError(403, 'ACCOUNT_BANNED', 'Hesabınız askıya alındı');
    }

    req.user = { id: user.id, subscriptionTier: user.subscriptionTier };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      next(new ApiError(401, 'TOKEN_EXPIRED', 'Oturum süresi doldu'));
    } else if (err.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'TOKEN_INVALID', 'Geçersiz token'));
    } else {
      next(err);
    }
  }
}
```

---

## 10. FLUTTER — SERTIFIKA PİNNİNG (OPSİYONEL AMA ÖNERİLİR)

```dart
// lib/core/network/dio_client.dart — Production için SSL pinning

import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/services.dart';

/// Production ortamında sertifika pinning etkinleştir.
/// Development'ta atlanabilir.
Future<SecurityContext?> createSecurityContext() async {
  if (const bool.fromEnvironment('DART_VM_PRODUCT') == false) {
    return null; // Development: pinning yok
  }

  try {
    final cert = await rootBundle.load('assets/certificates/api_cert.pem');
    final securityContext = SecurityContext(withTrustedRoots: false);
    securityContext.setTrustedCertificatesBytes(cert.buffer.asUint8List());
    return securityContext;
  } catch (e) {
    debugPrint('Sertifika yüklenemedi: $e');
    return null;
  }
}
```

---

## 11. API RESPONSE GÜVENLİĞİ — HASSAS VERİ FİLTRELEME

```typescript
// Hiçbir zaman response'a dahil edilmeyecek alanlar:
const SENSITIVE_FIELDS = [
  'passwordHash',
  'authProviderId',
  'banSuggestedBy',
  'referralCode',    // Sadece kendi profilinde gösterilir
];

// Kullanıcı objesini güvenli hale getir
function sanitizeUser(user: any): Partial<typeof user> {
  const sanitized = { ...user };
  for (const field of SENSITIVE_FIELDS) {
    delete sanitized[field];
  }
  return sanitized;
}

// Prisma select ile her zaman hassas alanları dışarıda bırak
const safeUserSelect = {
  id: true,
  nickname: true,
  countryCode: true,
  avatarIndex: true,
  subscriptionTier: true,
  createdAt: true,
  lastActiveAt: true,
  // passwordHash: ASLA SEÇİLMEZ
  // authProviderId: ASLA SEÇİLMEZ
};
```

---

## 12. ENVIRONMENT GÜVENLİĞİ

```typescript
// src/config/env.ts içinde güvenlik kontrolleri

// JWT secret'ların yeterince güçlü olduğunu doğrula
const envSchema = z.object({
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET en az 32 karakter olmalı')
    .refine(
      s => s !== 'your-secret-here' && s !== 'secret' && s !== 'changeme',
      'JWT_ACCESS_SECRET varsayılan değer kullanılamaz'
    ),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET en az 32 karakter olmalı')
    .refine(
      s => s !== 'your-secret-here' && s !== 'secret' && s !== 'changeme',
      'JWT_REFRESH_SECRET varsayılan değer kullanılamaz'
    )
    .refine(
      (s) => {
        // Access ve refresh secret farklı olmalı
        const accessSecret = process.env.JWT_ACCESS_SECRET ?? '';
        return s !== accessSecret;
      },
      'JWT_REFRESH_SECRET, JWT_ACCESS_SECRET ile aynı olamaz'
    ),

  NODE_ENV: z.enum(['development', 'test', 'production']),

  // Production'da debug logları kapatılmalı
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info')
    .refine(
      (level) => {
        if (process.env.NODE_ENV === 'production' && level === 'debug') {
          return false;
        }
        return true;
      },
      'Production ortamında debug log seviyesi kullanılamaz'
    ),
});
```

---

## 13. GÜVENLİK TESTLERİ

```typescript
// tests/security/rate-limit.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Rate Limiting', () => {

  it('Auth endpoint\'i 10 istekten sonra 429 döner', async () => {
    const requests = Array.from({ length: 11 }, () =>
      request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: 'test@test.com', password: 'wrong' })
    );

    const responses = await Promise.all(requests);
    const tooManyRequests = responses.filter(r => r.status === 429);

    expect(tooManyRequests.length).toBeGreaterThan(0);
  });

  it('429 yanıtı doğru hata kodu içerir', async () => {
    // Rate limit'i aş
    const promises = Array.from({ length: 15 }, () =>
      request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: 'x@x.com', password: 'wrong' })
    );
    const responses = await Promise.all(promises);
    const blocked = responses.find(r => r.status === 429);

    if (blocked) {
      expect(blocked.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    }
  });
});
```

```typescript
// tests/security/input-validation.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Input Validation', () => {

  it('XSS payload\'ı search\'te sanitize edilir', async () => {
    const xssPayload = '<script>alert("xss")</script>';

    const res = await request(app)
      .get('/api/v1/search')
      .query({ q: xssPayload, type: 'player' })
      .set('Authorization', 'Bearer valid-test-token');

    // Ya 400 döner (validation) ya da sonuç boş gelir
    // Script tag'ları işlenmez
    expect([200, 400]).toContain(res.status);
    if (res.status === 200) {
      expect(JSON.stringify(res.body)).not.toContain('<script>');
    }
  });

  it('Çok kısa arama sorgusu 400 döner', async () => {
    const res = await request(app)
      .get('/api/v1/search')
      .query({ q: 'a', type: 'player' })
      .set('Authorization', 'Bearer valid-test-token');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('Nickname\'de özel karakter 400 döner', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-test-token')
      .send({ nickname: 'Admin<script>' });

    expect(res.status).toBe(400);
  });

  it('10KB\'ı aşan payload 413 döner', async () => {
    const hugePayload = { entityIds: Array(1000).fill('x'.repeat(100)) };

    const res = await request(app)
      .post('/api/v1/sessions/test-id/submit')
      .set('Authorization', 'Bearer valid-test-token')
      .send(hugePayload);

    expect(res.status).toBe(413);
  });
});
```

---

## 14. GÜVENLİK KONTROL LİSTESİ — DEPLOYMENT ÖNCESİ

```
BACKEND
──────────────────────────────────────────────────────────────────────
✓ JWT_ACCESS_SECRET ve JWT_REFRESH_SECRET en az 32 karakter, birbirinden farklı
✓ BCRYPT_SALT_ROUNDS = 12
✓ Tüm endpoint'lerde Zod validation var
✓ `$queryRawUnsafe` hiç kullanılmıyor
✓ `passwordHash` hiçbir response'da yok
✓ Rate limit tüm auth endpoint'lerinde aktif
✓ Helmet middleware etkin
✓ CORS sadece izin verilen origin'lere açık
✓ express.json limit = 10kb
✓ Refresh token rotasyonu çalışıyor
✓ Token blacklist Redis'te (30 gün TTL)
✓ Token yeniden kullanım tespiti aktif
✓ Ban kontrolü her auth middleware'de yapılıyor
✓ Şüpheli oturum tespiti aktif (4s/cevap kuralı)
✓ Admin ve kullanıcı auth sistemi tamamen ayrı
✓ ADMIN_SESSION_SECRET en az 32 karakter
✓ NODE_ENV=production'da debug log kapalı
✓ Morgan logger'da hassas header'lar maskeleniyor

FLUTTER
──────────────────────────────────────────────────────────────────────
✓ JWT'ler FlutterSecureStorage'da (iOS Keychain, Android EncryptedSharedPrefs)
✓ API_BASE_URL --dart-define ile inject edilmiş, kodda hardcode yok
✓ Uygulama arka plana geçince token belleğe yazılmıyor
✓ Logout'ta clearAll() çağrılıyor
✓ AdMob App ID assets yerine native config dosyasında

ADMIN PANELİ
──────────────────────────────────────────────────────────────────────
✓ Session token localStorage'da (HttpOnly cookie tercih edilir)
✓ VITE_API_BASE_URL production'da HTTPS
✓ Admin build'i sadece admin subdomain'den erişilebilir
✓ Tüm mutasyonlarda confirm dialog var
```

---

## 15. KESİNLİKLE YAPILMAYACAKLAR

- `$queryRawUnsafe` kullanılmaz. Full-text search için `$queryRaw` template literal kullanılır.
- JWT secret'lar `.env.example`'da örnek değer olarak bile gerçek değer yazılmaz.
- `passwordHash` hiçbir API yanıtında yer almaz — select ile dışarıda bırakılır.
- Rate limit bypass için `skip: true` gibi bir seçenek eklenmez.
- Hata mesajlarında stack trace production'da döndürülmez.
- Client'tan gelen `score`, `rank`, `points` değerleri kabul edilmez — tüm hesaplamalar server-side.
- Güvenlik önlemleri "geliştirme kolaylığı" için gevşetilmez.
- `process.env` değerleri `env.ts` dışında doğrudan okunmaz.
- Token'lar cookie'ye yazılırken `HttpOnly` ve `Secure` flag'leri olmadan yazılmaz.
- Loglar production'da `console.log` ile değil, structured `logger` ile yazılır.
