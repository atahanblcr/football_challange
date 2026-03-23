---
name: backend-api
description: Specialized procedural guidance for backend-api in the Football Challenge project.
---

# SKILL: BACKEND API — NODE.JS + EXPRESS + TYPESCRIPT + PRISMA + ZOD

> Bu skill dosyası Football Challenge backend API'sinin nasıl yazılacağını tanımlar.
> Gemini bu dosyayı okuyarak her modülü tutarlı, tip güvenli ve test edilebilir şekilde yazar.
> Buradaki kalıpların dışına çıkılmaz. Farklı bir yaklaşım gerekiyorsa önce onay alınır.

---

## 1. PROJE KURULUMU

### package.json bağımlılıkları

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.10.0",
    "zod": "^3.22.4",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "ioredis": "^5.3.2",
    "node-cron": "^3.0.3",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "morgan": "^1.10.0",
    "dotenv": "^16.4.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "prisma": "^5.10.0",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/node-cron": "^3.0.11",
    "@types/cors": "^2.8.17",
    "@types/morgan": "^1.9.9",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "supertest": "^6.3.4",
    "@types/supertest": "^6.0.2",
    "ts-jest": "^29.1.2"
  },
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "jest --runInBand",
    "test:watch": "jest --watch",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:migrate:dev": "prisma migrate dev"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## 2. UYGULAMA GİRİŞ NOKTASI — app.ts

```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandlerMiddleware } from './middleware/error-handler.middleware';
import { authRouter } from './modules/auth/auth.router';
import { usersRouter } from './modules/users/users.router';
import { questionsRouter } from './modules/questions/questions.router';
import { sessionsRouter } from './modules/sessions/sessions.router';
import { searchRouter } from './modules/search/search.router';
import { leaderboardRouter } from './modules/leaderboard/leaderboard.router';
import { appConfigRouter } from './modules/app-config/app-config.router';
import { adminRouter } from './modules/admin/admin.router';
import { startAllJobs } from './jobs';

const app = express();

// Güvenlik middleware'leri
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10kb' })); // Büyük payload saldırısı önleme

// Route'lar
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/questions', questionsRouter);
app.use('/api/v1/sessions', sessionsRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/leaderboard', leaderboardRouter);
app.use('/api/v1/app', appConfigRouter);
app.use('/api/admin', adminRouter);

// Merkezi hata yakalayıcı — her zaman en sonda
app.use(errorHandlerMiddleware);

const PORT = parseInt(process.env.PORT ?? '3000', 10);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startAllJobs(); // Cron işlerini başlat
});

export default app; // Test için export
```

---

## 3. ORTAM DEĞİŞKENLERİ DOĞRULAMA — env.ts

```typescript
// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  ADMIN_SESSION_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  STORAGE_CDN_BASE_URL: z.string().url(),
});

// Uygulama başlarken hemen doğrula — hatalı .env ile çalışmaya başlama
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Geçersiz ortam değişkenleri:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
```

---

## 4. VERİTABANI İSTEMCİSİ — database.ts

```typescript
// src/config/database.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

## 5. HATA YÖNETİMİ STANDARDI

### ApiError Sınıfı

```typescript
// src/errors/api-error.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  // Sık kullanılan hatalar için factory metodlar
  static unauthorized(code = 'UNAUTHORIZED') {
    return new ApiError(401, code, 'Kimlik doğrulama gerekli');
  }

  static forbidden(code = 'FORBIDDEN') {
    return new ApiError(403, code, 'Bu işlem için yetkiniz yok');
  }

  static notFound(resource: string) {
    return new ApiError(404, 'NOT_FOUND', `${resource} bulunamadı`);
  }

  static conflict(code: string, message: string) {
    return new ApiError(409, code, message);
  }

  static tooManyRequests() {
    return new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Çok fazla istek gönderildi');
  }
}
```

### Hata Kodu Sabitleri

```typescript
// src/errors/error-codes.ts
export const ERROR_CODES = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  ACCOUNT_BANNED: 'ACCOUNT_BANNED',
  // User
  NICKNAME_TAKEN: 'NICKNAME_TAKEN',
  // Session
  SESSION_ALREADY_EXISTS: 'SESSION_ALREADY_EXISTS',
  DAILY_LIMIT_REACHED: 'DAILY_LIMIT_REACHED',
  AD_ALREADY_USED: 'AD_ALREADY_USED',
  QUESTION_ARCHIVING: 'QUESTION_ARCHIVING',
  // Event
  EVENT_ALREADY_ACTIVE: 'EVENT_ALREADY_ACTIVE',
  // General
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
```

### Merkezi Hata Middleware

```typescript
// src/middleware/error-handler.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../errors/api-error';
import { logger } from '../utils/logger.util';

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation hatası
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Geçersiz istek verisi',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  // Bilinen ApiError
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Bilinmeyen hata — logla ve genel mesaj dön
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id,
  });

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Sunucu hatası oluştu',
    },
  });
}
```

---

## 6. MODÜL YAZIM KALIPLARI

Her modül **router → controller → service** katmanını takip eder.
Controller sadece HTTP katmanını yönetir. İş mantığı service'te olur.

### Router Kalıbı

```typescript
// src/modules/users/users.router.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { rateLimitMiddleware } from '../../middleware/rate-limit.middleware';
import { UsersController } from './users.controller';

const router = Router();
const controller = new UsersController();

// Tüm user route'ları auth gerektirir
router.use(authMiddleware);

router.get('/me', controller.getMe);
router.patch('/me', controller.updateMe);
router.delete('/me', controller.deleteMe);
router.get(
  '/check-nickname/:nickname',
  rateLimitMiddleware.nicknameCheck,
  controller.checkNickname
);
router.get('/me/history', controller.getHistory);

export { router as usersRouter };
```

### Controller Kalıbı

```typescript
// src/modules/users/users.controller.ts
import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { updateProfileSchema } from './users.schema';

export class UsersController {
  private service = new UsersService();

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.getProfile(req.user!.id);
      res.json({ data: user });
    } catch (err) {
      next(err); // Hata her zaman next(err) ile merkezi handler'a gönderilir
    }
  };

  updateMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Gelen veriyi her zaman Zod ile doğrula
      const body = updateProfileSchema.parse(req.body);
      const updated = await this.service.updateProfile(req.user!.id, body);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  };

  deleteMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteAccount(req.user!.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  checkNickname = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nickname } = req.params;
      const available = await this.service.isNicknameAvailable(nickname);
      res.json({ data: { available } });
    } catch (err) {
      next(err);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const history = await this.service.getLeaderboardHistory(req.user!.id);
      res.json({ data: history });
    } catch (err) {
      next(err);
    }
  };
}
```

### Service Kalıbı

```typescript
// src/modules/users/users.service.ts
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { ApiError } from '../../errors/api-error';
import { ERROR_CODES } from '../../errors/error-codes';
import { UpdateProfileInput } from './users.schema';

export class UsersService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        countryCode: true,
        avatarIndex: true,
        subscriptionTier: true,
        premiumExpiresAt: true,
        createdAt: true,
        lastActiveAt: true,
      },
    });

    if (!user) throw ApiError.notFound('Kullanıcı');
    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    // Nickname değişiyorsa müsaitlik kontrolü
    if (data.nickname) {
      const existing = await prisma.user.findFirst({
        where: { nickname: data.nickname, id: { not: userId } },
      });
      if (existing) {
        throw ApiError.conflict(ERROR_CODES.NICKNAME_TAKEN, 'Bu kullanıcı adı zaten alınmış');
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        ...(data.nickname ? { nicknameChangedAt: new Date() } : {}),
      },
    });
  }

  async deleteAccount(userId: string) {
    // 1. Redis leaderboard'lardan kaldır
    const leaderboardKeys = await redis.keys('leaderboard:*');
    if (leaderboardKeys.length > 0) {
      const pipeline = redis.pipeline();
      leaderboardKeys.forEach(key => pipeline.zrem(key, userId));
      await pipeline.exec();
    }

    // 2. Cascade ile tüm oturumlar ve puan geçmişi silinir (DB constraint)
    await prisma.user.delete({ where: { id: userId } });
  }

  async isNicknameAvailable(nickname: string): Promise<boolean> {
    const existing = await prisma.user.findUnique({
      where: { nickname },
      select: { id: true },
    });
    return !existing;
  }

  async getLeaderboardHistory(userId: string) {
    return prisma.leaderboardSnapshot.findMany({
      where: { rankings: { path: ['$[*].user_id'], array_contains: userId } },
      orderBy: { snapshotAt: 'desc' },
      take: 10,
    });
  }
}
```

### Zod Schema Kalıbı

```typescript
// src/modules/users/users.schema.ts
import { z } from 'zod';

export const updateProfileSchema = z.object({
  nickname: z
    .string()
    .min(3, 'En az 3 karakter')
    .max(20, 'En fazla 20 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Sadece harf, rakam ve alt çizgi')
    .optional(),
  countryCode: z.string().length(2).toUpperCase().optional(),
  avatarIndex: z.number().int().min(0).max(30).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
```

---

## 7. AUTH MIDDLEWARE

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import { ApiError } from '../errors/api-error';
import { ERROR_CODES } from '../errors/error-codes';
import { prisma } from '../config/database';

// Express Request'e user alanı ekle
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; subscriptionTier: string };
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized();
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token); // throws if invalid/expired

    // Ban kontrolü
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isBanned: true, subscriptionTier: true },
    });

    if (!user) throw ApiError.unauthorized();
    if (user.isBanned) {
      throw new ApiError(403, ERROR_CODES.ACCOUNT_BANNED, 'Hesabınız askıya alındı');
    }

    req.user = { id: user.id, subscriptionTier: user.subscriptionTier };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      next(new ApiError(401, ERROR_CODES.TOKEN_EXPIRED, 'Oturum süresi doldu'));
    } else {
      next(err);
    }
  }
}
```

---

## 8. RATE LIMIT MIDDLEWARE

```typescript
// src/middleware/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit';
import { ApiError } from '../errors/api-error';

const makeHandler = (windowMs: number, max: number) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(ApiError.tooManyRequests());
    },
  });

export const rateLimitMiddleware = {
  auth: makeHandler(15 * 60 * 1000, 10),            // Auth: 10/15dk
  search: makeHandler(60 * 1000, 20),               // Search: 20/dk
  sessionSubmit: makeHandler(60 * 60 * 1000, 30),   // Submit: 30/saat
  adminLogin: makeHandler(15 * 60 * 1000, 5),       // Admin giriş: 5/15dk
  nicknameCheck: makeHandler(60 * 1000, 30),        // Nickname: 30/dk
};
```

---

## 9. API YANIT FORMATI

Tüm başarılı yanıtlar `{ data: ... }` formatında döner.
Tüm hata yanıtları `{ error: { code, message, details? } }` formatında döner.
Liste yanıtları `{ data: [...], meta: { total, page, limit } }` formatında döner.

```typescript
// src/utils/response.util.ts
export function successResponse<T>(data: T) {
  return { data };
}

export function listResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    data: items,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
```

---

## 10. LOGGER UTILITY

```typescript
// src/utils/logger.util.ts
type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level?: LogLevel;
  message: string;
  [key: string]: unknown;
}

function log(level: LogLevel, entry: LogEntry) {
  const output = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    ...entry,
  });

  if (level === 'error') {
    console.error(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  info: (entry: LogEntry) => log('info', entry),
  warn: (entry: LogEntry) => log('warn', entry),
  error: (entry: LogEntry) => log('error', entry),
};
```

---

## 11. TEST YAZIM KALIPLARI

Her endpoint için integration testi Supertest ile yazılır.
Service katmanı için birim testi Jest ile yazılır.

### Integration Test Kalıbı

```typescript
// tests/users/update-profile.test.ts
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { generateTestToken } from '../helpers/auth.helper';

describe('PATCH /api/v1/users/me', () => {
  let userId: string;
  let accessToken: string;

  beforeEach(async () => {
    // Test kullanıcısı oluştur
    const user = await prisma.user.create({
      data: {
        nickname: 'TestUser',
        email: 'test@test.com',
        authProvider: 'email',
        countryCode: 'TR',
        referralCode: 'TEST1234',
      },
    });
    userId = user.id;
    accessToken = generateTestToken(userId);
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { email: 'test@test.com' } });
  });

  it('geçerli nickname güncellenir', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nickname: 'YeniNick42' });

    expect(res.status).toBe(200);
    expect(res.body.data.nickname).toBe('YeniNick42');
  });

  it('alınmış nickname 409 döner', async () => {
    await prisma.user.create({
      data: {
        nickname: 'AlınmışNick',
        authProvider: 'email',
        countryCode: 'TR',
        referralCode: 'OTHER123',
      },
    });

    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nickname: 'AlınmışNick' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('NICKNAME_TAKEN');
  });

  it('auth token olmadan 401 döner', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .send({ nickname: 'Test' });

    expect(res.status).toBe(401);
  });
});
```

### Service Birim Testi Kalıbı

```typescript
// Prisma'yı mock'la — gerçek DB'ye bağlanma
jest.mock('../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { UsersService } from '../../src/modules/users/users.service';
import { prisma } from '../../src/config/database';
import { ApiError } from '../../src/errors/api-error';

describe('UsersService.isNicknameAvailable', () => {
  const service = new UsersService();

  it('mevcut nickname için false döner', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'some-id' });
    const result = await service.isNicknameAvailable('AlınmışNick');
    expect(result).toBe(false);
  });

  it('müsait nickname için true döner', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const result = await service.isNicknameAvailable('MüsaitNick');
    expect(result).toBe(true);
  });
});
```

---

## 12. KESİNLİKLE YAPILMAYACAKLAR

- Controller'da iş mantığı yazılmaz. Sadece `parse → service.method → res.json`.
- Service'te `res`, `req` objelerine erişilmez.
- Ham SQL yazılmaz. Prisma ORM kullanılır.
- `try/catch` içinde `console.log` kullanılmaz. `logger` utility kullanılır.
- Validation olmadan `req.body` değeri kullanılmaz.
- `any` tipi kullanılmaz. `unknown` kullanılır, sonra type guard ile daraltılır.
- Test dosyası olmadan endpoint tamamlandı sayılmaz.
- `.env` içindeki değerlere `process.env.X` ile doğrudan erişilmez. `env.X` kullanılır.
