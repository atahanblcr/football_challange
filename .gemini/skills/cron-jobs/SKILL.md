---
name: cron-jobs
description: Specialized procedural guidance for cron-jobs in the Football Challenge project.
---

# SKILL: CRON JOBS — TÜM ZAMANLANMIŞ İŞLER TAM İMPLEMENTASYON

> Bu skill dosyası Football Challenge'ın tüm cron işlerini tanımlar.
> Her cron'un ne zaman çalışacağı, ne yapacağı ve hata durumunda
> nasıl davranacağı burada kesinleştirilmiştir.
> Tüm zamanlar UTC+3 (Europe/Istanbul) timezone'undadır.

---

## 1. CRON TABLOSU — TAM REFERANS

| Cron Adı | Schedule (UTC+3) | Açıklama |
|---|---|---|
| `daily_limit_reset` | Her gün 00:00 | Günlük soru hakkı sayaçlarını sıfırla |
| `daily_question_selector` | Her gün 00:05 | Her modül için günlük soruyu seç ve ata |
| `cooldown_cleanup` | Her gün 01:00 | 90 günü dolan soruları havuza geri al |
| `suspicious_flag_report` | Her gün 08:00 | Şüpheli oturumları logla ve admin'e bildir |
| `pool_health_check` | Her gün 09:00 | Soru havuzu < eşik ise uyarı oluştur |
| `leaderboard_archiver_weekly` | Her Pazartesi 00:01 | Haftalık snapshot + Redis sıfırlama |
| `leaderboard_archiver_monthly` | Her ayın 1'i 00:01 | Aylık snapshot + Redis sıfırlama |
| `leaderboard_archiver_quarterly` | Oca/Nis/Tem/Eki 1'i 00:01 | Üç aylık snapshot + Redis sıfırlama |
| `archiving_auto_complete` | Her gün 00:10 | `archiving` durumundaki soruları `archived`'a taşı |

---

## 2. CRON KAYIT MERKEZİ — index.ts

```typescript
// src/jobs/index.ts
import cron from 'node-cron';
import { startDailyLimitResetJob } from './daily-limit-reset.job';
import { startDailyQuestionSelectorJob } from './daily-question-selector.job';
import { startCooldownCleanupJob } from './cooldown-cleanup.job';
import { startSuspiciousFlagReportJob } from './suspicious-flag-report.job';
import { startPoolHealthCheckJob } from './pool-health-check.job';
import { startLeaderboardArchiverJob } from './leaderboard-archiver.job';
import { startArchivingAutoCompleteJob } from './archiving-auto-complete.job';
import { logger } from '../utils/logger.util';

export function startAllJobs(): void {
  logger.info({ message: '⏰ Cron işleri başlatılıyor...' });

  startDailyLimitResetJob();
  startDailyQuestionSelectorJob();
  startCooldownCleanupJob();
  startSuspiciousFlagReportJob();
  startPoolHealthCheckJob();
  startLeaderboardArchiverJob();
  startArchivingAutoCompleteJob();

  logger.info({ message: '✅ Tüm cron işleri kayıt edildi.' });
}
```

---

## 3. GÜNLÜK LİMİT SIFIRLAMA

```typescript
// src/jobs/daily-limit-reset.job.ts
import cron from 'node-cron';
import { redis } from '../config/redis';
import { logger } from '../utils/logger.util';

/**
 * Her gün UTC+3 00:00'da çalışır.
 * Kullanıcıların günlük soru hakkı sayaçlarını Redis'ten siler.
 * Key formatı: daily_limit:{userId}:{date}  (örn: daily_limit:abc123:2025-06-09)
 * Key TTL 24 saat olduğu için bu iş aslında yedek güvencedir.
 * Ancak eksik TTL durumlarına karşı gün başında tüm günün key'leri temizlenir.
 */
export function startDailyLimitResetJob(): void {
  cron.schedule('0 0 * * *', async () => {
    await runDailyLimitReset();
  }, { timezone: 'Europe/Istanbul' });

  logger.info({ message: 'Cron kayıt: daily_limit_reset [00:00 UTC+3]' });
}

export async function runDailyLimitReset(): Promise<void> {
  logger.info({ message: '[CRON] daily_limit_reset başladı' });

  try {
    // Dünün tarihine ait limit key'lerini sil
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0]; // "2025-06-08"

    const keys = await redis.keys(`daily_limit:*:${dateStr}`);

    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info({
        message: '[CRON] daily_limit_reset tamamlandı',
        deletedKeys: keys.length,
        date: dateStr,
      });
    } else {
      logger.info({ message: '[CRON] daily_limit_reset: silinecek key yok' });
    }
  } catch (err: any) {
    logger.error({
      message: '[CRON] daily_limit_reset HATA',
      error: err.message,
    });
    // Cron hatası uygulamayı çökertemez — sadece loglanır
  }
}
```

---

## 4. GÜNLÜK SORU SEÇİCİ

```typescript
// src/jobs/daily-question-selector.job.ts
import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger.util';

const MODULES = ['players', 'clubs', 'nationals', 'managers'] as const;
type Module = typeof MODULES[number];

/**
 * Her gün UTC+3 00:05'te çalışır (limit reset'ten 5dk sonra).
 * Her modül için bir sonraki 7 günün sorularını seçer ve atar.
 * Eğer yarın için atama yoksa o gün random bir soru seçilir.
 *
 * Seçim kriterleri:
 * 1. status = 'active'
 * 2. isSpecial = false
 * 3. Bugün için daha önce atanmamış
 * 4. Son 90 günde kullanılmamış (cooldown)
 * 5. Rastgele seç (RANDOM())
 */
export function startDailyQuestionSelectorJob(): void {
  cron.schedule('5 0 * * *', async () => {
    await runDailyQuestionSelector();
  }, { timezone: 'Europe/Istanbul' });

  logger.info({ message: 'Cron kayıt: daily_question_selector [00:05 UTC+3]' });
}

export async function runDailyQuestionSelector(): Promise<void> {
  logger.info({ message: '[CRON] daily_question_selector başladı' });

  const results: Record<string, string> = {};
  const errors: Record<string, string> = {};

  // Yarın için atama yap (bu gün değil — bu gün halihazırda atanmış olabilir)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  for (const module of MODULES) {
    try {
      // Yarın için zaten atama var mı?
      const existing = await prisma.dailyQuestionAssignment.findFirst({
        where: {
          date: tomorrow,
          module,
        },
      });

      if (existing) {
        logger.info({
          message: `[CRON] Atama zaten mevcut: ${module} / ${tomorrow.toISOString().split('T')[0]}`,
        });
        continue;
      }

      // Son 90 günde kullanılmış soruları bul
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const recentlyUsedIds = await prisma.dailyQuestionAssignment.findMany({
        where: {
          module,
          date: { gte: ninetyDaysAgo },
        },
        select: { questionId: true },
      });

      const usedIds = recentlyUsedIds.map(r => r.questionId);

      // Uygun sorular arasından rastgele seç
      const candidates = await prisma.question.findMany({
        where: {
          module,
          status: 'active',
          isSpecial: false,
          id: { notIn: usedIds },
        },
        select: { id: true },
      });

      if (candidates.length === 0) {
        errors[module] = 'Uygun soru bulunamadı';
        logger.error({
          message: `[CRON] daily_question_selector: ${module} için soru yok!`,
          date: tomorrow.toISOString().split('T')[0],
        });
        continue;
      }

      // Rastgele seç
      const selected = candidates[Math.floor(Math.random() * candidates.length)];

      await prisma.dailyQuestionAssignment.create({
        data: {
          date: tomorrow,
          module,
          questionId: selected.id,
          isSpecial: false,
        },
      });

      results[module] = selected.id;
      logger.info({
        message: `[CRON] Atama yapıldı: ${module} → ${selected.id}`,
        date: tomorrow.toISOString().split('T')[0],
      });
    } catch (err: any) {
      errors[module] = err.message;
      logger.error({
        message: `[CRON] daily_question_selector HATA: ${module}`,
        error: err.message,
      });
    }
  }

  logger.info({
    message: '[CRON] daily_question_selector tamamlandı',
    results,
    errors,
  });
}
```

---

## 5. COOLDOWN TEMİZLEME

```typescript
// src/jobs/cooldown-cleanup.job.ts
import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger.util';

/**
 * Her gün UTC+3 01:00'de çalışır.
 * cooldownUntil < şimdiki zaman olan GameSession kayıtlarını temizler.
 * Bu sayede aynı kullanıcı 90 gün sonra aynı soruyu oynayabilir.
 *
 * NOT: GameSession kaydını silmez. Sadece cooldown'ın bittiğini teyit eder.
 * Yeni oturum oluştururken cooldownUntil > now kontrolü yapılır.
 * Bu cron, istatistik tutarlılığı için eski tamamlanmış oturumları
 * (90 günü dolmuş) arşiv tabloya taşıyabilir (opsiyonel).
 */
export function startCooldownCleanupJob(): void {
  cron.schedule('0 1 * * *', async () => {
    await runCooldownCleanup();
  }, { timezone: 'Europe/Istanbul' });

  logger.info({ message: 'Cron kayıt: cooldown_cleanup [01:00 UTC+3]' });
}

export async function runCooldownCleanup(): Promise<void> {
  logger.info({ message: '[CRON] cooldown_cleanup başladı' });

  try {
    const now = new Date();

    // cooldownUntil geçmiş olan oturumları bul ve cooldownUntil'i null yap
    // Bu, "soru havuza geri döndü" anlamına gelir
    const updated = await prisma.gameSession.updateMany({
      where: {
        cooldownUntil: { lte: now },
        submittedAt: { not: null }, // Tamamlanmış oturumlar
      },
      data: {
        cooldownUntil: null,
      },
    });

    logger.info({
      message: '[CRON] cooldown_cleanup tamamlandı',
      releasedCount: updated.count,
      timestamp: now.toISOString(),
    });
  } catch (err: any) {
    logger.error({
      message: '[CRON] cooldown_cleanup HATA',
      error: err.message,
    });
  }
}
```

---

## 6. ŞÜPHELİ OTURUM RAPORU

```typescript
// src/jobs/suspicious-flag-report.job.ts
import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger.util';

/**
 * Her gün UTC+3 08:00'de çalışır.
 * Dün tespit edilen şüpheli oturumları loglar.
 * Admin panel bu veriyi dashboard'da gösterir.
 *
 * İlerleyen sürümde: e-posta bildirimi eklenebilir.
 */
export function startSuspiciousFlagReportJob(): void {
  cron.schedule('0 8 * * *', async () => {
    await runSuspiciousFlagReport();
  }, { timezone: 'Europe/Istanbul' });

  logger.info({ message: 'Cron kayıt: suspicious_flag_report [08:00 UTC+3]' });
}

export async function runSuspiciousFlagReport(): Promise<void> {
  logger.info({ message: '[CRON] suspicious_flag_report başladı' });

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const suspiciousSessions = await prisma.gameSession.findMany({
      where: {
        flagSuspicious: true,
        submittedAt: {
          gte: yesterday,
          lt: today,
        },
      },
      select: {
        id: true,
        userId: true,
        suspiciousReason: true,
        submittedAt: true,
        user: {
          select: { nickname: true, email: true },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });

    if (suspiciousSessions.length === 0) {
      logger.info({ message: '[CRON] suspicious_flag_report: Şüpheli oturum yok' });
      return;
    }

    // Kullanıcı bazında grupla
    const byUser = new Map<string, typeof suspiciousSessions>();
    for (const s of suspiciousSessions) {
      if (!byUser.has(s.userId)) byUser.set(s.userId, []);
      byUser.get(s.userId)!.push(s);
    }

    // Tekrar eden şüpheli kullanıcılar (2+ oturum) daha fazla dikkat gerektirir
    const repeatOffenders: string[] = [];
    byUser.forEach((sessions, userId) => {
      if (sessions.length >= 2) repeatOffenders.push(userId);
    });

    logger.warn({
      message: '[CRON] suspicious_flag_report: Şüpheli oturumlar tespit edildi',
      date: yesterday.toISOString().split('T')[0],
      totalCount: suspiciousSessions.length,
      uniqueUsers: byUser.size,
      repeatOffenders: repeatOffenders.length,
      details: suspiciousSessions.map(s => ({
        sessionId: s.id,
        userId: s.userId,
        nickname: s.user.nickname,
        reason: s.suspiciousReason,
        submittedAt: s.submittedAt,
      })),
    });

    // Tekrarlı şüphelilere otomatik ban önerisi koy
    if (repeatOffenders.length > 0) {
      await prisma.user.updateMany({
        where: {
          id: { in: repeatOffenders },
          isBanned: false,
          banSuggested: false,
        },
        data: {
          banSuggested: true,
          banSuggestedAt: new Date(),
          banSuggestedBy: 'system_cron',
        },
      });

      logger.warn({
        message: '[CRON] Otomatik ban önerisi oluşturuldu',
        userIds: repeatOffenders,
      });
    }
  } catch (err: any) {
    logger.error({
      message: '[CRON] suspicious_flag_report HATA',
      error: err.message,
    });
  }
}
```

---

## 7. HAVUZ SAĞLIĞI KONTROLÜ

```typescript
// src/jobs/pool-health-check.job.ts
import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger.util';

const MODULES = ['players', 'clubs', 'nationals', 'managers'] as const;

// Uyarı eşikleri
const DANGER_THRESHOLD  = 5;  // 🚨 Kırmızı uyarı
const WARNING_THRESHOLD = 7;  // ⚠️ Sarı uyarı

/**
 * Her gün UTC+3 09:00'da çalışır.
 * Her modül için kullanılabilir soru sayısını kontrol eder.
 * Eşik altına düşen modüller için uyarı loglar.
 * Admin panel bu uyarıları dashboard'da gösterir.
 */
export function startPoolHealthCheckJob(): void {
  cron.schedule('0 9 * * *', async () => {
    await runPoolHealthCheck();
  }, { timezone: 'Europe/Istanbul' });

  logger.info({ message: 'Cron kayıt: pool_health_check [09:00 UTC+3]' });
}

export async function runPoolHealthCheck(): Promise<void> {
  logger.info({ message: '[CRON] pool_health_check başladı' });

  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const report: Array<{
      module: string;
      availableCount: number;
      status: 'ok' | 'warning' | 'danger';
    }> = [];

    for (const module of MODULES) {
      // Son 90 günde kullanılan soruları bul
      const recentlyUsed = await prisma.dailyQuestionAssignment.findMany({
        where: {
          module,
          date: { gte: ninetyDaysAgo },
        },
        select: { questionId: true },
      });
      const usedIds = recentlyUsed.map(r => r.questionId);

      // Kullanılabilir soru sayısı
      const availableCount = await prisma.question.count({
        where: {
          module,
          status: 'active',
          isSpecial: false,
          id: { notIn: usedIds },
        },
      });

      let status: 'ok' | 'warning' | 'danger';
      if (availableCount <= DANGER_THRESHOLD) {
        status = 'danger';
      } else if (availableCount <= WARNING_THRESHOLD) {
        status = 'warning';
      } else {
        status = 'ok';
      }

      report.push({ module, availableCount, status });
    }

    // Raporla
    const warnings = report.filter(r => r.status === 'warning');
    const dangers  = report.filter(r => r.status === 'danger');

    if (dangers.length > 0) {
      logger.error({
        message: '[CRON] pool_health_check: KRİTİK - Havuz tükeniyor!',
        dangers: dangers.map(d => `${d.module}: ${d.availableCount} soru`),
      });
    }

    if (warnings.length > 0) {
      logger.warn({
        message: '[CRON] pool_health_check: UYARI - Havuz azalıyor',
        warnings: warnings.map(w => `${w.module}: ${w.availableCount} soru`),
      });
    }

    logger.info({
      message: '[CRON] pool_health_check tamamlandı',
      report,
    });

    // Admin panel için Redis'e yaz (dashboard'da gösterilecek)
    const { redis } = await import('../config/redis');
    await redis.setex(
      'pool_health:latest',
      25 * 60 * 60, // 25 saat TTL (yarınki çalışmaya kadar geçerli)
      JSON.stringify({ report, updatedAt: new Date().toISOString() })
    );
  } catch (err: any) {
    logger.error({
      message: '[CRON] pool_health_check HATA',
      error: err.message,
    });
  }
}
```

---

## 8. LEADERBOARD ARŞİVLEYİCİ

```typescript
// src/jobs/leaderboard-archiver.job.ts
import cron from 'node-cron';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { buildLeaderboardKey, getISOWeekKey, getMonthKey, getQuarterKey } from '../utils/redis-keys.util';
import { logger } from '../utils/logger.util';

/**
 * Üç ayrı schedule:
 * - Haftalık: Her Pazartesi 00:01 UTC+3 → önceki haftayı arşivle
 * - Aylık: Her ayın 1'i 00:01 UTC+3 → önceki ayı arşivle
 * - Üç aylık: Oca/Nis/Tem/Eki 1'i 00:01 UTC+3 → önceki çeyreği arşivle
 */
export function startLeaderboardArchiverJob(): void {
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

  logger.info({ message: 'Cron kayıt: leaderboard_archiver [Haftalık/Aylık/3Aylık]' });
}

type ArchivePeriod = 'weekly' | 'monthly' | 'quarterly';

async function archivePeriod(period: ArchivePeriod): Promise<void> {
  logger.info({ message: `[CRON] leaderboard_archiver başladı: ${period}` });

  const now = new Date();
  const previousDate = getPreviousPeriodDate(period, now);

  let periodKey: string;
  switch (period) {
    case 'weekly':    periodKey = getISOWeekKey(previousDate); break;
    case 'monthly':   periodKey = getMonthKey(previousDate);   break;
    case 'quarterly': periodKey = getQuarterKey(previousDate); break;
  }

  try {
    for (const scope of ['global', 'tr'] as const) {
      const redisKey = buildLeaderboardKey({ scope, period, date: previousDate });

      // 1. Top 100 snapshot al
      const top100 = await getTop100WithDetails(redisKey);

      if (top100.length === 0) {
        logger.info({ message: `[CRON] ${redisKey} boş, atlanıyor` });
        await redis.del(redisKey); // Yine de key'i sil
        continue;
      }

      // 2. PostgreSQL'e snapshot kaydet (önce snapshot, sonra sil!)
      await prisma.leaderboardSnapshot.upsert({
        where: {
          period_periodKey_scope: { period, periodKey, scope },
        },
        update: { rankings: top100, snapshotAt: now },
        create: {
          period,
          periodKey,
          scope,
          snapshotAt: now,
          rankings: top100,
        },
      });

      // 3. Redis key'ini sil
      await redis.del(redisKey);

      logger.info({
        message: `[CRON] Arşivlendi: ${redisKey}`,
        count: top100.length,
        periodKey,
      });
    }

    logger.info({ message: `[CRON] leaderboard_archiver tamamlandı: ${period}`, periodKey });
  } catch (err: any) {
    logger.error({
      message: `[CRON] leaderboard_archiver HATA: ${period}`,
      error: err.message,
      periodKey,
    });
    // Hata durumunda Redis key SİLİNMEZ — veri kaybı önlenir
  }
}

async function getTop100WithDetails(redisKey: string): Promise<Array<{
  rank: number;
  userId: string;
  nickname: string;
  score: number;
}>> {
  const raw = await redis.zrevrangebyscore(
    redisKey, '+inf', '-inf',
    'WITHSCORES', 'LIMIT', 0, 100
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
  switch (period) {
    case 'weekly':    d.setDate(d.getDate() - 7);    break;
    case 'monthly':   d.setMonth(d.getMonth() - 1);   break;
    case 'quarterly': d.setMonth(d.getMonth() - 3);   break;
  }
  return d;
}
```

---

## 9. ARŞİVLEME OTO-TAMAMLAMA

```typescript
// src/jobs/archiving-auto-complete.job.ts
import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger.util';

/**
 * Her gün UTC+3 00:10'da çalışır.
 * status='archiving' olan soruları kontrol eder.
 * 10 dakika önce başlamış aktif oturumu kalmayan soruları 'archived' yapar.
 *
 * Akış:
 * Admin arşivle → aktif oturum varsa → status='archiving'
 * Bu cron → 10dk sonra aktif oturum kalmadıysa → status='archived'
 */
export function startArchivingAutoCompleteJob(): void {
  cron.schedule('10 0 * * *', async () => {
    await runArchivingAutoComplete();
  }, { timezone: 'Europe/Istanbul' });

  logger.info({ message: 'Cron kayıt: archiving_auto_complete [00:10 UTC+3]' });
}

export async function runArchivingAutoComplete(): Promise<void> {
  logger.info({ message: '[CRON] archiving_auto_complete başladı' });

  try {
    // Arşivlenmeyi bekleyen soruları bul
    const archivingQuestions = await prisma.question.findMany({
      where: { status: 'archiving' },
      select: { id: true },
    });

    if (archivingQuestions.length === 0) {
      logger.info({ message: '[CRON] archiving_auto_complete: Bekleyen soru yok' });
      return;
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    let archivedCount = 0;

    for (const question of archivingQuestions) {
      // Hâlâ aktif (bitmemiş) oturumu var mı?
      const activeCount = await prisma.gameSession.count({
        where: {
          questionId: question.id,
          submittedAt: null,
          startedAt: { gte: tenMinutesAgo },
        },
      });

      if (activeCount === 0) {
        await prisma.question.update({
          where: { id: question.id },
          data: {
            status: 'archived',
            archivedAt: new Date(),
          },
        });
        archivedCount++;
        logger.info({
          message: `[CRON] Soru arşivlendi: ${question.id}`,
        });
      } else {
        logger.info({
          message: `[CRON] Soru hâlâ aktif oturum içeriyor, bekleniyor: ${question.id}`,
          activeCount,
        });
      }
    }

    logger.info({
      message: '[CRON] archiving_auto_complete tamamlandı',
      total: archivingQuestions.length,
      archived: archivedCount,
      stillWaiting: archivingQuestions.length - archivedCount,
    });
  } catch (err: any) {
    logger.error({
      message: '[CRON] archiving_auto_complete HATA',
      error: err.message,
    });
  }
}
```

---

## 10. CRON TEST YARDIMCILARI

Her cron'un `run*` fonksiyonu dışa aktarılır — böylece testlerde schedule beklemeden çağrılabilir.

```typescript
// tests/jobs/daily-question-selector.test.ts
import { prisma } from '../../src/config/database';
import { runDailyQuestionSelector } from '../../src/jobs/daily-question-selector.job';

describe('runDailyQuestionSelector()', () => {

  beforeEach(async () => {
    // Test soruları oluştur
    await prisma.question.createMany({
      data: [
        { id: 'q-player-1', title: 'Test', module: 'players', status: 'active',
          difficulty: 'easy', basePoints: 100, timeLimit: 60, answerCount: 5,
          isSpecial: false, createdBy: 'admin-1' },
        { id: 'q-clubs-1', title: 'Test', module: 'clubs', status: 'active',
          difficulty: 'medium', basePoints: 100, timeLimit: 90, answerCount: 5,
          isSpecial: false, createdBy: 'admin-1' },
      ],
    });
  });

  afterEach(async () => {
    await prisma.dailyQuestionAssignment.deleteMany({});
    await prisma.question.deleteMany({ where: { id: { startsWith: 'q-' } } });
  });

  it('yarın için her modüle soru atar', async () => {
    await runDailyQuestionSelector();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const assignments = await prisma.dailyQuestionAssignment.findMany({
      where: { date: tomorrow },
    });

    // En az players ve clubs atanmış olmalı (test verisi bu ikisi için var)
    expect(assignments.length).toBeGreaterThanOrEqual(2);
  });

  it('aynı gün için iki kez çalışınca mevcut atamayı değiştirmez', async () => {
    await runDailyQuestionSelector();
    await runDailyQuestionSelector(); // İkinci çalıştırma

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const assignments = await prisma.dailyQuestionAssignment.findMany({
      where: { date: tomorrow, module: 'players' },
    });

    // Aynı modül için sadece 1 atama olmalı
    expect(assignments.length).toBe(1);
  });
});
```

```typescript
// tests/jobs/pool-health-check.test.ts
import { runPoolHealthCheck } from '../../src/jobs/pool-health-check.job';
import { redis } from '../../src/config/redis';

describe('runPoolHealthCheck()', () => {
  afterEach(async () => {
    await redis.del('pool_health:latest');
  });

  it('Redis\'e pool_health:latest yazar', async () => {
    await runPoolHealthCheck();

    const raw = await redis.get('pool_health:latest');
    expect(raw).not.toBeNull();

    const data = JSON.parse(raw!);
    expect(data.report).toBeDefined();
    expect(Array.isArray(data.report)).toBe(true);
    expect(data.updatedAt).toBeDefined();
  });
});
```

---

## 11. CRON HATA YÖNETİMİ KURALLARI

```typescript
// Tüm cron'larda uyulması gereken hata yönetimi kalıbı:

async function runAnyCronJob(): Promise<void> {
  logger.info({ message: '[CRON] iş_adı başladı' });

  try {
    // ... iş mantığı ...

    logger.info({ message: '[CRON] iş_adı tamamlandı', /* istatistikler */ });
  } catch (err: any) {
    logger.error({
      message: '[CRON] iş_adı HATA',
      error: err.message,
      stack: err.stack,
    });
    // ÖNEMLİ: throw edilmez — cron process'i çökertemez
    // Sadece loglanır
  }
}
```

**Kurallar:**
1. Her cron try/catch ile sarılır — hata fırlatılmaz, sadece loglanır.
2. Her cron başında ve sonunda log yazılır.
3. Kısmi başarı durumunda (bazı modüller başarılı, bazıları değil) diğerleri etkilenmez.
4. Leaderboard arşivlemede hata olursa Redis key **silinmez** (veri kaybı önlenir).
5. Her cron'un `run*` fonksiyonu export edilir (test edilebilirlik için).

---

## 12. KESİNLİKLE YAPILMAYACAKLAR

- Cron schedule'ları UTC'ye elle çevrilmez. `timezone: 'Europe/Istanbul'` kullanılır.
- Leaderboard arşivlemede hata olursa Redis key silinmez — önce snapshot, sonra sil.
- Günlük soru seçici aynı günü iki kez seçemez — `findFirst` ile kontrol yapılır.
- Cron içinde `process.exit()` çağrılmaz.
- Cron'lar birbirini beklemez — her biri bağımsız çalışır.
- Test için `schedule` çalıştırılmaz, `run*` fonksiyonu doğrudan çağrılır.
- `startAllJobs()` sadece `app.ts`'ten çağrılır, test dosyalarından değil.
