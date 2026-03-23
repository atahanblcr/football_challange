---
name: redis-leaderboard
description: Specialized procedural guidance for redis-leaderboard in the Football Challenge project.
---

# SKILL: REDIS LEADERBOARD — KEY YAPISI, SORGULAR, ARŞİVLEME

> Bu skill dosyası Football Challenge sıralama sisteminin Redis implementasyonunu tanımlar.
> Key isimlendirme, pipeline kullanımı, periyot sıfırlama ve snapshot alma kuralları burada belirlenir.
> Leaderboard ile ilgili hiçbir şey bu dosya okunmadan kodlanmaz.

---

## 1. REDIS İSTEMCİSİ — KURULUM

```typescript
// src/config/redis.ts
import { Redis } from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.UPSTASH_REDIS_REST_URL, {
  password: env.UPSTASH_REDIS_REST_TOKEN,
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redis.on('error', (err) => {
  console.error('[Redis] Bağlantı hatası:', err.message);
});
```

---

## 2. KEY YAPISI — TAM REFERANS

Tüm leaderboard key'leri aşağıdaki konvansiyona uyar.
**Bu konvansiyonun dışına çıkılmaz.**

```
leaderboard:{scope}:{period}
leaderboard:{scope}:{period}:{periodKey}
leaderboard:module:{module}:{scope}:{period}
```

### Tüm Key Örnekleri

```
# GENEL SIRALAMALAR
leaderboard:global:alltime
leaderboard:global:weekly:2025-W24
leaderboard:global:monthly:2025-06
leaderboard:global:quarterly:2025-Q2

leaderboard:tr:alltime
leaderboard:tr:weekly:2025-W24
leaderboard:tr:monthly:2025-06
leaderboard:tr:quarterly:2025-Q2

# MODÜL SIRALAMALAR (sadece alltime)
leaderboard:module:players:global:alltime
leaderboard:module:players:tr:alltime
leaderboard:module:clubs:global:alltime
leaderboard:module:clubs:tr:alltime
leaderboard:module:nationals:global:alltime
leaderboard:module:nationals:tr:alltime
leaderboard:module:managers:global:alltime
leaderboard:module:managers:tr:alltime

# ÖZEL ETKİNLİK SIRALAMA
leaderboard:event:{eventId}:global
leaderboard:event:{eventId}:tr
```

### Periyot Key Formatları

```typescript
// src/utils/redis-keys.util.ts

/**
 * ISO hafta: "2025-W24"
 * Her pazartesi sıfırlanır.
 */
export function getISOWeekKey(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Ay: "2025-06"
 * Her ayın 1'inde sıfırlanır.
 */
export function getMonthKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Çeyrek: "2025-Q1" | "2025-Q2" | "2025-Q3" | "2025-Q4"
 * Ocak / Nisan / Temmuz / Ekim 1'inde sıfırlanır.
 */
export function getQuarterKey(date: Date): string {
  const y = date.getUTCFullYear();
  const q = Math.ceil((date.getUTCMonth() + 1) / 3);
  return `${y}-Q${q}`;
}

/**
 * Verilen scope + period + module kombinasyonu için key döner.
 */
export function buildLeaderboardKey(params: {
  scope: 'global' | 'tr';
  period: 'alltime' | 'weekly' | 'monthly' | 'quarterly';
  module?: string;
  date?: Date;
  eventId?: string;
}): string {
  const { scope, period, module, date = new Date(), eventId } = params;

  if (eventId) {
    return `leaderboard:event:${eventId}:${scope}`;
  }

  if (module) {
    return `leaderboard:module:${module}:${scope}:alltime`;
  }

  if (period === 'alltime') {
    return `leaderboard:${scope}:alltime`;
  }

  if (period === 'weekly') {
    return `leaderboard:${scope}:weekly:${getISOWeekKey(date)}`;
  }

  if (period === 'monthly') {
    return `leaderboard:${scope}:monthly:${getMonthKey(date)}`;
  }

  if (period === 'quarterly') {
    return `leaderboard:${scope}:quarterly:${getQuarterKey(date)}`;
  }

  throw new Error(`Geçersiz period: ${period}`);
}

/**
 * Belirli bir kullanıcının kaldırılması gereken tüm key'leri listele.
 * Hesap silinirken kullanılır.
 */
export async function getAllLeaderboardKeys(): Promise<string[]> {
  const keys = await redis.keys('leaderboard:*');
  return keys;
}
```

---

## 3. LEADERBOARD SERVICE — TAM İMPLEMENTASYON

```typescript
// src/modules/leaderboard/leaderboard.service.ts
import { redis } from '../../config/redis';
import { prisma } from '../../config/database';
import { buildLeaderboardKey } from '../../utils/redis-keys.util';

export type LeaderboardScope = 'global' | 'tr';
export type LeaderboardPeriod = 'alltime' | 'weekly' | 'monthly' | 'quarterly';
export type LeaderboardModule = 'players' | 'clubs' | 'nationals' | 'managers';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  avatarIndex: number;
  countryCode: string;
  score: number;
  isCurrentUser: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  myEntry: LeaderboardEntry | null;
  totalCount: number;
}

const PAGE_SIZE = 50;

export class LeaderboardService {

  /**
   * Sıralama listesini getir.
   * - Top 50 kullanıcı
   * - Kullanıcının kendi sırası (liste dışında olsa bile)
   */
  async getLeaderboard(params: {
    scope: LeaderboardScope;
    period: LeaderboardPeriod;
    module?: LeaderboardModule;
    eventId?: string;
    currentUserId: string;
    page?: number;
  }): Promise<LeaderboardResponse> {
    const { scope, period, module, eventId, currentUserId, page = 0 } = params;

    const key = buildLeaderboardKey({ scope, period, module, eventId });
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    // Redis'ten top N kullanıcıyı çek (puan yüksekten düşüğe)
    const rawEntries = await redis.zrevrangebyscore(
      key,
      '+inf',
      '-inf',
      'WITHSCORES',
      'LIMIT',
      start,
      PAGE_SIZE
    );

    // Toplam kullanıcı sayısı
    const totalCount = await redis.zcard(key);

    // Kullanıcı bilgilerini DB'den toplu çek
    const userIds: string[] = [];
    const scores: number[] = [];
    for (let i = 0; i < rawEntries.length; i += 2) {
      userIds.push(rawEntries[i]);
      scores.push(parseFloat(rawEntries[i + 1]));
    }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nickname: true, avatarIndex: true, countryCode: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const entries: LeaderboardEntry[] = userIds
      .map((userId, idx) => {
        const user = userMap.get(userId);
        if (!user) return null;
        return {
          rank: start + idx + 1,
          userId,
          nickname: user.nickname,
          avatarIndex: user.avatarIndex,
          countryCode: user.countryCode ?? 'XX',
          score: scores[idx],
          isCurrentUser: userId === currentUserId,
        };
      })
      .filter(Boolean) as LeaderboardEntry[];

    // Kullanıcının kendi sırasını bul (listede olmasa bile)
    const myEntry = await this.getMyRank(key, currentUserId, userMap);

    return { entries, myEntry, totalCount };
  }

  /**
   * Kullanıcının belirli bir leaderboard'daki sırasını döner.
   */
  private async getMyRank(
    key: string,
    userId: string,
    userMap: Map<string, { nickname: string; avatarIndex: number; countryCode: string | null }>
  ): Promise<LeaderboardEntry | null> {
    const [rank, score] = await Promise.all([
      redis.zrevrank(key, userId),  // 0-indexed, null ise listede yok
      redis.zscore(key, userId),
    ]);

    if (rank === null || score === null) return null;

    let user = userMap.get(userId);
    if (!user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { nickname: true, avatarIndex: true, countryCode: true },
      });
      if (!dbUser) return null;
      user = dbUser;
    }

    return {
      rank: rank + 1, // 0-indexed → 1-indexed
      userId,
      nickname: user.nickname,
      avatarIndex: user.avatarIndex,
      countryCode: user.countryCode ?? 'XX',
      score: parseFloat(score),
      isCurrentUser: true,
    };
  }

  /**
   * Puan ekle — session submit sonrası çağrılır.
   * Pipeline ile tüm key'ler tek seferde güncellenir.
   */
  async addPoints(params: {
    userId: string;
    points: number;
    module: LeaderboardModule;
    isSpecialEvent: boolean;
    eventId?: string;
    userCountryCode: string;
    date?: Date;
  }): Promise<void> {
    const { userId, points, module, isSpecialEvent, eventId, userCountryCode, date = new Date() } = params;

    const pipeline = redis.pipeline();

    // Sadece TR kullanıcıları TR leaderboard'a girer
    const scopes: LeaderboardScope[] =
      userCountryCode.toUpperCase() === 'TR'
        ? ['global', 'tr']
        : ['global'];

    for (const scope of scopes) {
      // Genel sıralamalar (4 periyot)
      pipeline.zincrby(buildLeaderboardKey({ scope, period: 'alltime' }), points, userId);
      pipeline.zincrby(buildLeaderboardKey({ scope, period: 'weekly', date }), points, userId);
      pipeline.zincrby(buildLeaderboardKey({ scope, period: 'monthly', date }), points, userId);
      pipeline.zincrby(buildLeaderboardKey({ scope, period: 'quarterly', date }), points, userId);

      // Modül sıralaması (sadece alltime)
      pipeline.zincrby(buildLeaderboardKey({ scope, period: 'alltime', module }), points, userId);

      // Özel etkinlik sıralaması
      if (isSpecialEvent && eventId) {
        pipeline.zincrby(buildLeaderboardKey({ scope, period: 'alltime', eventId }), points, userId);
      }
    }

    await pipeline.exec();
  }

  /**
   * Hesap silinirken kullanıcıyı tüm leaderboard'lardan kaldır.
   */
  async removeUser(userId: string): Promise<void> {
    const allKeys = await redis.keys('leaderboard:*');
    if (allKeys.length === 0) return;

    const pipeline = redis.pipeline();
    allKeys.forEach(key => pipeline.zrem(key, userId));
    await pipeline.exec();
  }

  /**
   * Kullanıcının tüm sıralamalardaki pozisyonunu tek seferde döner.
   * Profil ekranı için kullanılır.
   */
  async getAllRanks(userId: string, userCountryCode: string): Promise<{
    global_alltime: number | null;
    tr_alltime: number | null;
    modules: Record<LeaderboardModule, { global: number | null; tr: number | null }>;
  }> {
    const scopes: LeaderboardScope[] = ['global', 'tr'];
    const modules: LeaderboardModule[] = ['players', 'clubs', 'nationals', 'managers'];

    const pipeline = redis.pipeline();

    pipeline.zrevrank(buildLeaderboardKey({ scope: 'global', period: 'alltime' }), userId);
    pipeline.zrevrank(buildLeaderboardKey({ scope: 'tr', period: 'alltime' }), userId);

    for (const mod of modules) {
      pipeline.zrevrank(buildLeaderboardKey({ scope: 'global', period: 'alltime', module: mod }), userId);
      pipeline.zrevrank(buildLeaderboardKey({ scope: 'tr', period: 'alltime', module: mod }), userId);
    }

    const results = await pipeline.exec();

    const toRank = (raw: [Error | null, unknown] | null): number | null => {
      if (!raw || raw[0]) return null;
      const val = raw[1];
      return val !== null ? (val as number) + 1 : null;
    };

    let idx = 0;
    const global_alltime = toRank(results?.[idx++] ?? null);
    const tr_alltime = toRank(results?.[idx++] ?? null);

    const modulesResult = {} as Record<LeaderboardModule, { global: number | null; tr: number | null }>;
    for (const mod of modules) {
      modulesResult[mod] = {
        global: toRank(results?.[idx++] ?? null),
        tr: toRank(results?.[idx++] ?? null),
      };
    }

    return { global_alltime, tr_alltime, modules: modulesResult };
  }
}
```

---

## 4. LEADERBOARD ROUTER VE CONTROLLER

```typescript
// src/modules/leaderboard/leaderboard.router.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { LeaderboardController } from './leaderboard.controller';

const router = Router();
const controller = new LeaderboardController();

router.use(authMiddleware);

// GET /api/v1/leaderboard?scope=global&period=weekly&module=players
router.get('/', controller.getLeaderboard);

// GET /api/v1/leaderboard/me — tüm sıralamalar tek seferde
router.get('/me', controller.getMyRanks);

export { router as leaderboardRouter };
```

```typescript
// src/modules/leaderboard/leaderboard.controller.ts
import { Request, Response, NextFunction } from 'express';
import { LeaderboardService, LeaderboardScope, LeaderboardPeriod } from './leaderboard.service';
import { z } from 'zod';

const querySchema = z.object({
  scope: z.enum(['global', 'tr']).default('global'),
  period: z.enum(['alltime', 'weekly', 'monthly', 'quarterly']).default('alltime'),
  module: z.enum(['players', 'clubs', 'nationals', 'managers']).optional(),
  eventId: z.string().uuid().optional(),
  page: z.string().transform(Number).default('0'),
});

export class LeaderboardController {
  private service = new LeaderboardService();

  getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = querySchema.parse(req.query);
      const result = await this.service.getLeaderboard({
        ...query,
        currentUserId: req.user!.id,
      });
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  };

  getMyRanks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await import('../../config/database').then(m =>
        m.prisma.user.findUnique({
          where: { id: req.user!.id },
          select: { countryCode: true },
        })
      );
      const ranks = await this.service.getAllRanks(
        req.user!.id,
        user?.countryCode ?? 'XX'
      );
      res.json({ data: ranks });
    } catch (err) {
      next(err);
    }
  };
}
```

---

## 5. CRON: LEADERBOARD ARŞİVLEME VE SIFIRLAMA

### Çalışma Periyotları (UTC+3)

| Cron | Zaman | Ne Yapar |
|---|---|---|
| Haftalık arşiv | Her Pazartesi 00:01 | Geçen haftanın snapshot'ını al, Redis key'ini sil |
| Aylık arşiv | Her ayın 1'i 00:01 | Geçen ayın snapshot'ını al, Redis key'ini sil |
| Üç aylık arşiv | Ocak/Nisan/Temmuz/Ekim 1'i 00:01 | Geçen çeyreğin snapshot'ını al, Redis key'ini sil |

```typescript
// src/jobs/leaderboard-archiver.job.ts
import cron from 'node-cron';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { getISOWeekKey, getMonthKey, getQuarterKey, buildLeaderboardKey } from '../utils/redis-keys.util';
import { logger } from '../utils/logger.util';

// UTC+3 için offset: cron UTC zamanında çalışır
// 00:01 UTC+3 = 21:01 UTC önceki gün
// Basitlik için TZ=Europe/Istanbul env set edilir ve cron local time kullanır

export function startLeaderboardArchiverJob() {

  // Haftalık — Her Pazartesi 00:01
  cron.schedule('1 0 * * 1', async () => {
    await archivePeriod('weekly');
  }, { timezone: 'Europe/Istanbul' });

  // Aylık — Her ayın 1'i 00:01
  cron.schedule('1 0 1 * *', async () => {
    await archivePeriod('monthly');
  }, { timezone: 'Europe/Istanbul' });

  // Üç aylık — Ocak/Nisan/Temmuz/Ekim 1'i 00:01
  cron.schedule('1 0 1 1,4,7,10 *', async () => {
    await archivePeriod('quarterly');
  }, { timezone: 'Europe/Istanbul' });
}

type ArchivePeriod = 'weekly' | 'monthly' | 'quarterly';

async function archivePeriod(period: ArchivePeriod): Promise<void> {
  const now = new Date();

  // Hangi periyot bitti? Şu anki değil, bir önceki.
  const previousDate = getPreviousPeriodDate(period, now);

  let periodKey: string;
  if (period === 'weekly') periodKey = getISOWeekKey(previousDate);
  else if (period === 'monthly') periodKey = getMonthKey(previousDate);
  else periodKey = getQuarterKey(previousDate);

  logger.info({ message: `Leaderboard arşivleme başladı: ${period} / ${periodKey}` });

  try {
    for (const scope of ['global', 'tr'] as const) {
      const key = buildLeaderboardKey({ scope, period, date: previousDate });

      // Top 100 snapshot al
      const top100 = await getTop100WithDetails(key);
      if (top100.length === 0) {
        logger.info({ message: `${key} boş, atlanıyor` });
        continue;
      }

      // PostgreSQL'e kaydet
      await prisma.leaderboardSnapshot.create({
        data: {
          period,
          periodKey,
          scope,
          snapshotAt: now,
          rankings: top100,
        },
      });

      // Redis key'ini sil
      await redis.del(key);

      logger.info({
        message: `Arşivlendi: ${key} → ${top100.length} kayıt`,
        period,
        periodKey,
        scope,
      });
    }
  } catch (err: any) {
    logger.error({ message: `Leaderboard arşivleme hatası: ${period}`, error: err.message });
    throw err;
  }
}

async function getTop100WithDetails(redisKey: string): Promise<Array<{
  rank: number;
  userId: string;
  nickname: string;
  score: number;
}>> {
  const raw = await redis.zrevrangebyscore(
    redisKey,
    '+inf',
    '-inf',
    'WITHSCORES',
    'LIMIT',
    0,
    100
  );

  if (raw.length === 0) return [];

  const userIds: string[] = [];
  const scores: number[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    userIds.push(raw[i]);
    scores.push(parseFloat(raw[i + 1]));
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, nickname: true },
  });

  const userMap = new Map(users.map(u => [u.id, u.nickname]));

  return userIds.map((userId, idx) => ({
    rank: idx + 1,
    userId,
    nickname: userMap.get(userId) ?? 'Silinmiş Kullanıcı',
    score: scores[idx],
  }));
}

function getPreviousPeriodDate(period: ArchivePeriod, now: Date): Date {
  const d = new Date(now);
  if (period === 'weekly') {
    d.setDate(d.getDate() - 7); // Geçen hafta
  } else if (period === 'monthly') {
    d.setMonth(d.getMonth() - 1); // Geçen ay
  } else {
    d.setMonth(d.getMonth() - 3); // Geçen çeyrek
  }
  return d;
}
```

---

## 6. CRON: HAFTALİK/AYLIK KÜMÜLATIF SIFIRLAMA NOTU

> Haftalık ve aylık key'ler silinince o periyodun puanı sıfırlanmış olur.
> **alltime key'i asla silinmez ve sıfırlanmaz.**
> Kullanıcı hesabı silinirse o zaman `ZREM` ile alltime dahil tüm key'lerden kaldırılır.
> Yeni key oluşturma gerekmez: `ZINCRBY` var olmayan key'i otomatik oluşturur.

---

## 7. LEADERBOARD SNAPSHOT TABLOSU (Prisma)

```prisma
// prisma/schema.prisma içinde

model LeaderboardSnapshot {
  id          String   @id @default(cuid())
  period      String   // 'weekly' | 'monthly' | 'quarterly'
  periodKey   String   // '2025-W24' | '2025-06' | '2025-Q2'
  scope       String   // 'global' | 'tr'
  snapshotAt  DateTime
  rankings    Json     // Array<{ rank, userId, nickname, score }>

  @@unique([period, periodKey, scope])
  @@index([period, scope])
}
```

---

## 8. FLUTTER — LEADERBOARD SERVİSİ İSTEK YAPISI

```dart
// lib/features/leaderboard/data/leaderboard_repository.dart

class LeaderboardRepository {
  final Dio _dio;

  LeaderboardRepository(this._dio);

  Future<LeaderboardResponse> getLeaderboard({
    required String scope,   // 'global' | 'tr'
    required String period,  // 'alltime' | 'weekly' | 'monthly' | 'quarterly'
    String? module,          // 'players' | 'clubs' | 'nationals' | 'managers'
    String? eventId,
    int page = 0,
  }) async {
    final response = await _dio.get('/leaderboard', queryParameters: {
      'scope': scope,
      'period': period,
      if (module != null) 'module': module,
      if (eventId != null) 'eventId': eventId,
      'page': page,
    });
    return LeaderboardResponse.fromJson(response.data['data']);
  }

  Future<AllRanksResponse> getMyRanks() async {
    final response = await _dio.get('/leaderboard/me');
    return AllRanksResponse.fromJson(response.data['data']);
  }
}
```

---

## 9. BİRİM TESTLERİ

```typescript
// tests/leaderboard/leaderboard.test.ts
import { redis } from '../../src/config/redis';
import { LeaderboardService } from '../../src/modules/leaderboard/leaderboard.service';
import { buildLeaderboardKey, getISOWeekKey, getMonthKey, getQuarterKey } from '../../src/utils/redis-keys.util';

describe('LeaderboardService', () => {
  const service = new LeaderboardService();
  const testUserId = 'test-user-001';
  const testKey = 'leaderboard:test:cleanup';

  afterEach(async () => {
    // Test key'lerini temizle
    const keys = await redis.keys('leaderboard:test:*');
    if (keys.length > 0) await redis.del(...keys);
  });

  describe('buildLeaderboardKey()', () => {
    it('alltime key doğru oluşturulur', () => {
      const key = buildLeaderboardKey({ scope: 'global', period: 'alltime' });
      expect(key).toBe('leaderboard:global:alltime');
    });

    it('haftalık key doğru oluşturulur', () => {
      const date = new Date('2025-06-09T10:00:00Z'); // Haftanın içi
      const key = buildLeaderboardKey({ scope: 'tr', period: 'weekly', date });
      expect(key).toMatch(/^leaderboard:tr:weekly:2025-W\d{2}$/);
    });

    it('modül key doğru oluşturulur', () => {
      const key = buildLeaderboardKey({ scope: 'global', period: 'alltime', module: 'players' });
      expect(key).toBe('leaderboard:module:players:global:alltime');
    });

    it('event key doğru oluşturulur', () => {
      const key = buildLeaderboardKey({ scope: 'global', period: 'alltime', eventId: 'event-abc' });
      expect(key).toBe('leaderboard:event:event-abc:global');
    });
  });

  describe('getISOWeekKey()', () => {
    it('2025-06-09 Pazartesi → W24', () => {
      expect(getISOWeekKey(new Date('2025-06-09'))).toBe('2025-W24');
    });

    it('Yıl sonu haftası doğru hesaplanır', () => {
      const key = getISOWeekKey(new Date('2025-12-29'));
      expect(key).toMatch(/^\d{4}-W\d{2}$/);
    });
  });

  describe('getQuarterKey()', () => {
    it('Ocak → Q1', () => {
      expect(getQuarterKey(new Date('2025-01-15'))).toBe('2025-Q1');
    });
    it('Nisan → Q2', () => {
      expect(getQuarterKey(new Date('2025-04-01'))).toBe('2025-Q2');
    });
    it('Temmuz → Q3', () => {
      expect(getQuarterKey(new Date('2025-07-10'))).toBe('2025-Q3');
    });
    it('Ekim → Q4', () => {
      expect(getQuarterKey(new Date('2025-10-31'))).toBe('2025-Q4');
    });
  });

  describe('removeUser()', () => {
    it('kullanıcı tüm leaderboard key\'lerinden kaldırılır', async () => {
      // Test verisi ekle
      await redis.zadd('leaderboard:global:alltime', 100, testUserId);
      await redis.zadd('leaderboard:tr:alltime', 100, testUserId);

      await service.removeUser(testUserId);

      const globalRank = await redis.zrevrank('leaderboard:global:alltime', testUserId);
      const trRank = await redis.zrevrank('leaderboard:tr:alltime', testUserId);

      expect(globalRank).toBeNull();
      expect(trRank).toBeNull();
    });
  });
});
```

---

## 10. KESİNLİKLE YAPILMAYACAKLAR

- Key isimlerinde bu konvansiyonun dışına çıkılmaz. `lb:`, `rank:` gibi kısaltmalar kullanılmaz.
- `KEYS` komutu production'da doğrudan router/controller'dan çağrılmaz (sadece cron'da ve hesap silmede).
- Her pipeline sonrası `.exec()` çağrılır. Zincirleme unutulmaz.
- TR leaderboard'a sadece `countryCode === 'TR'` olan kullanıcılar eklenir — global'e herkes.
- `alltime` key'i hiçbir zaman silinmez veya sıfırlanmaz.
- Snapshot alınmadan önce Redis key silinmez. Her zaman önce snapshot, sonra `DEL`.
- Eşitlik durumunda sıralama kullanıcı nickname'ine göre alfabetik yapılır (Redis bunu yapmaz; uygulama katmanında işlenir).
