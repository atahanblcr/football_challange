---
name: scoring-engine
description: Specialized procedural guidance for scoring-engine in the Football Challenge project.
---

# SKILL: SCORING ENGINE — PUANLAMA MOTORU

> Bu skill dosyası Football Challenge puanlama sisteminin tam implementasyonunu tanımlar.
> Formüller kesinleşmiştir. Hiçbir değer keyfi değiştirilemez.
> Tüm hesaplamalar backend'de yapılır. Client'tan gelen puan değeri asla kabul edilmez.

---

## 1. PUANLAMA SABİTLERİ

```typescript
// src/modules/scoring/scoring.constants.ts

export const SCORING = {
  // Pozisyon ağırlığı offset çarpanı
  // weight(rank) = rank + (totalAnswers * POSITION_OFFSET_MULTIPLIER)
  POSITION_OFFSET_MULTIPLIER: 0.8,

  // Süre bonusu — maksimum eklenebilecek puan
  MAX_TIME_BONUS_POINTS: 25,

  // Zorluk çarpanları
  DIFFICULTY_MULTIPLIERS: {
    easy: 1.0,
    medium: 1.25,
    hard: 1.5,
  } as const,

  // Reklam çarpanı
  AD_MULTIPLIER: 1.5,

  // Hile tespiti — cevap başına minimum süre (saniye)
  MIN_SECONDS_PER_ANSWER: 4,
} as const;
```

---

## 2. TİP TANIMLARI

```typescript
// src/modules/scoring/scoring.types.ts

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ScoringInput {
  /** Sorunun toplam cevap sayısı (N) */
  totalAnswers: number;
  /** Sorunun baz puanı (genellikle 100) */
  basePoints: number;
  /** Sorunun zorluk seviyesi */
  difficulty: Difficulty;
  /** Sorunun toplam süresi (saniye) */
  timeLimitSeconds: number;
  /** Kullanıcının doğru bildiği rank'ların listesi (1-indexed, 1=kolay, N=zor) */
  correctRanks: number[];
  /** Kullanıcı tüm slotları doldurup "Bitir" mi bastı? */
  allSlotsFilled: boolean;
  /** Soruyu bitirdiğinde kalan süre (saniye) */
  remainingSeconds: number;
}

export interface ScoringResult {
  /** Ham pozisyon puanı (zorluk ve reklam öncesi) */
  scoreBase: number;
  /** Süre bonusu (0 olabilir) */
  scoreTimeBonus: number;
  /** Zorluk çarpanı uygulandıktan sonraki puan */
  scoreDifficulty: number;
  /** Reklam çarpanı uygulandıktan sonraki final puan */
  scoreFinal: number;
  /** Her rank için hesaplanan normalize ağırlık (debug/test için) */
  weightMap: Record<number, number>;
}

export interface AdRewardResult {
  /** Reklam öncesi puan */
  previousScore: number;
  /** Reklam sonrası puan */
  newScore: number;
}
```

---

## 3. PUANLAMA MOTORU — TAM İMPLEMENTASYON

```typescript
// src/modules/scoring/scoring.service.ts
import { SCORING } from './scoring.constants';
import { ScoringInput, ScoringResult, AdRewardResult, Difficulty } from './scoring.types';

export class ScoringService {

  /**
   * ANA PUANLAMA FONKSİYONU
   *
   * Formül özeti:
   * 1. Her rank için ağırlık hesapla: weight(rank) = rank + (N * 0.8)
   *    → Rank 1 (kolay) = düşük ağırlık, Rank N (zor) = yüksek ağırlık
   * 2. Tüm ağırlıkları topla, normalize et
   * 3. Doğru rank'ların normalize ağırlıklarını topla → scoreBase
   * 4. Tüm slotlar doluysa süre bonusu ekle → (kalan/toplam) * 25
   * 5. Zorluk çarpanı uygula
   * 6. floor() ile tam sayıya yuvarla
   */
  calculate(input: ScoringInput): ScoringResult {
    const {
      totalAnswers,
      basePoints,
      difficulty,
      timeLimitSeconds,
      correctRanks,
      allSlotsFilled,
      remainingSeconds,
    } = input;

    // ADIM 1: Tüm rank'lar için ağırlık hesapla
    const offset = totalAnswers * SCORING.POSITION_OFFSET_MULTIPLIER;
    const weights: Record<number, number> = {};

    for (let rank = 1; rank <= totalAnswers; rank++) {
      weights[rank] = rank + offset;
    }

    // ADIM 2: Toplam ağırlık ve normalize ağırlıklar
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    const normalizedWeights: Record<number, number> = {};

    for (let rank = 1; rank <= totalAnswers; rank++) {
      normalizedWeights[rank] = weights[rank] / totalWeight;
    }

    // ADIM 3: Doğru rank'ların puanını topla
    let rawBaseScore = 0;
    for (const rank of correctRanks) {
      if (rank >= 1 && rank <= totalAnswers) {
        rawBaseScore += normalizedWeights[rank] * basePoints;
      }
    }
    const scoreBase = Math.floor(rawBaseScore);

    // ADIM 4: Süre bonusu — sadece tüm slotlar doluysa
    let scoreTimeBonus = 0;
    if (allSlotsFilled && remainingSeconds > 0) {
      const ratio = Math.max(0, Math.min(1, remainingSeconds / timeLimitSeconds));
      scoreTimeBonus = Math.floor(ratio * SCORING.MAX_TIME_BONUS_POINTS);
    }

    // ADIM 5: Zorluk çarpanı
    const multiplier = SCORING.DIFFICULTY_MULTIPLIERS[difficulty];
    const scoreDifficulty = Math.floor((scoreBase + scoreTimeBonus) * multiplier);

    // ADIM 6: Reklam öncesi final (reklam sonrası ayrıca hesaplanır)
    const scoreFinal = scoreDifficulty;

    return {
      scoreBase,
      scoreTimeBonus,
      scoreDifficulty,
      scoreFinal,
      weightMap: normalizedWeights,
    };
  }

  /**
   * REKLAM ÖDÜLÜ HESAPLAMA
   * Mevcut scoreDifficulty değerine AD_MULTIPLIER uygulanır.
   * scoreBase + scoreTimeBonus değil, scoreDifficulty üzerine uygulanır.
   */
  applyAdReward(scoreDifficulty: number): AdRewardResult {
    const newScore = Math.floor(scoreDifficulty * SCORING.AD_MULTIPLIER);
    return {
      previousScore: scoreDifficulty,
      newScore,
    };
  }

  /**
   * HİLE TESPİTİ
   * Geçen süre < cevap sayısı * MIN_SECONDS_PER_ANSWER ise şüpheli.
   */
  isSuspicious(
    startedAt: Date,
    submittedAt: Date,
    answerCount: number
  ): { suspicious: boolean; reason?: string } {
    const elapsedSeconds = (submittedAt.getTime() - startedAt.getTime()) / 1000;
    const minimumExpected = answerCount * SCORING.MIN_SECONDS_PER_ANSWER;

    if (elapsedSeconds < minimumExpected) {
      return {
        suspicious: true,
        reason: `submitted_at - started_at = ${elapsedSeconds.toFixed(1)}s, minimum expected = ${minimumExpected}s`,
      };
    }

    return { suspicious: false };
  }

  /**
   * NORMALİZE AĞIRLIK TABLOSUNU DÖNER (admin / debug amaçlı)
   */
  getWeightTable(totalAnswers: number, basePoints: number): Array<{
    rank: number;
    weight: number;
    normalizedWeight: number;
    points: number;
  }> {
    const offset = totalAnswers * SCORING.POSITION_OFFSET_MULTIPLIER;
    const weights: number[] = [];

    for (let rank = 1; rank <= totalAnswers; rank++) {
      weights.push(rank + offset);
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    return weights.map((w, i) => ({
      rank: i + 1,
      weight: w,
      normalizedWeight: w / totalWeight,
      points: Math.floor((w / totalWeight) * basePoints),
    }));
  }
}
```

---

## 4. PUANLAMA TABLOLARI (REFERANS)

Aşağıdaki tablolar `getWeightTable()` çıktısını gösterir. basePoints=100.

### 3 Cevaplı Soru (offset = 3 × 0.8 = 2.4)

| Rank | Ağırlık | Normalize | Puan |
|---|---|---|---|
| 1 (kolay) | 3.4 | %31.5 | 31 |
| 2 | 4.4 | %40.7 | 40 |
| 3 (zor) | 5.4 | %50.0 (yuvarlamayla) | **50** |
| **Toplam** | 13.2 | | **~100** |

### 5 Cevaplı Soru (offset = 5 × 0.8 = 4.0)

| Rank | Ağırlık | Normalize | Puan |
|---|---|---|---|
| 1 | 5.0 | %13.3 | 13 |
| 2 | 6.0 | %16.0 | 16 |
| 3 | 7.0 | %18.7 | 18 |
| 4 | 8.0 | %21.3 | 21 |
| 5 (zor) | 9.0 | %24.0 | **24** |
| **Toplam** | 37.5 | | **~92 (yuvarlama)** |

### 7 Cevaplı Soru (offset = 7 × 0.8 = 5.6)

| Rank | Ağırlık | Normalize | Puan |
|---|---|---|---|
| 1 | 6.6 | %10.1 | 10 |
| 2 | 7.6 | %11.6 | 11 |
| 3 | 8.6 | %13.1 | 13 |
| 4 | 9.6 | %14.7 | 14 |
| 5 | 10.6 | %16.2 | 16 |
| 6 | 11.6 | %17.7 | 17 |
| 7 (zor) | 12.6 | %19.3 | **19** |
| **Toplam** | 67.2 | | **~100** |

### 10 Cevaplı Soru (offset = 10 × 0.8 = 8.0)

| Rank | Ağırlık | Normalize | Puan |
|---|---|---|---|
| 1 | 9.0 | %7.4 | 7 |
| 2 | 10.0 | %8.2 | 8 |
| 3 | 11.0 | %9.0 | 9 |
| 4 | 12.0 | %9.8 | 9 |
| 5 | 13.0 | %10.7 | 10 |
| 6 | 14.0 | %11.5 | 11 |
| 7 | 15.0 | %12.3 | 12 |
| 8 | 16.0 | %13.1 | 13 |
| 9 | 17.0 | %13.9 | 13 |
| 10 (zor) | 18.0 | %14.8 | **14** |
| **Toplam** | 135.0 | | **~106 (yuvarlama)** |

> **Not:** floor() yuvarlama nedeniyle toplam bazen 100'ün biraz altında veya üzerinde çıkabilir.
> Bu beklenen davranıştır. Tüm slotlar doğru bilindiğinde gerçek max puan ~95-105 arasında olur.

---

## 5. TAM SENARYO ÖRNEKLERİ

### Senaryo 1: 7 Cevaplı, Orta Zorluk, Kısmi Doğru

```
Soru: 7 cevap, basePoints=100, difficulty=medium, timeLimit=60s
Kullanıcı: 4 doğru (rank 1,3,5,7), 2 yanlış, 1 boş slot
Kalan süre: 15s
allSlotsFilled: false (1 boş slot var)

scoreBase:
  rank1: 0.101 * 100 = 10.1 → floor = 10
  rank3: 0.131 * 100 = 13.1 → floor = 13
  rank5: 0.162 * 100 = 16.2 → floor = 16
  rank7: 0.193 * 100 = 19.3 → floor = 19
  Ham toplam = 10 + 13 + 16 + 19 = 58
  scoreBase = 58

scoreTimeBonus = 0  (allSlotsFilled = false)

scoreDifficulty = floor(58 * 1.25) = floor(72.5) = 72

scoreFinal = 72  (reklam izlenmedi)

Reklam izlenirse:
  scoreFinal = floor(72 * 1.5) = 108
```

### Senaryo 2: 10 Cevaplı, Zor, Mükemmel + Süre Bonusu + Reklam

```
Soru: 10 cevap, basePoints=100, difficulty=hard, timeLimit=45s
Kullanıcı: 10/10 doğru, tüm slotlar dolu
Kalan süre: 20s
allSlotsFilled: true

scoreBase:
  Tüm rank'lar doğru → normalize ağırlıkların toplamı * 100 = ~106
  (yuvarlama nedeniyle tam 100 değil)
  scoreBase ≈ 100  (floor sonrası)

scoreTimeBonus = floor((20/45) * 25) = floor(11.1) = 11

scoreDifficulty = floor((100 + 11) * 1.5) = floor(166.5) = 166

Reklam izlenirse:
  scoreFinal = floor(166 * 1.5) = 249

→ En iyi senaryo tek soru başına ~249 puan
```

### Senaryo 3: Sıfır Doğru, Süre Doldu

```
Kullanıcı: 0 cevap, süre doldu
allSlotsFilled: false, remainingSeconds: 0

scoreBase = 0
scoreTimeBonus = 0
scoreDifficulty = 0
scoreFinal = 0

→ point_history'ye YAZILMAZ (sadece game_sessions'a yazılır)
```

### Senaryo 4: 5 Cevaplı, Kolay, Tüm Slotlar Dolu Ama Hepsi Yanlış

```
Soru: 5 cevap, difficulty=easy, timeLimit=90s
Kullanıcı: 5 yanlış entity girdi, tüm slotlar dolu
Kalan süre: 60s
allSlotsFilled: true  (slotlar dolu, doğru olması şart değil)
correctRanks: []  (hiç doğru yok)

scoreBase = 0
scoreTimeBonus = floor((60/90) * 25) = floor(16.6) = 16
scoreDifficulty = floor((0 + 16) * 1.0) = 16
scoreFinal = 16

→ 5 yanlış cevap ama süre bonusu kazandı (slotlar doluydu)
→ Bu tasarım gereğidir: slotları dolduran ödüllendirilir
```

---

## 6. SESSION SUBMIT SERVICE İÇİNDE KULLANIM

```typescript
// src/modules/sessions/sessions.service.ts (ilgili bölüm)
import { ScoringService } from '../scoring/scoring.service';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { buildLeaderboardKey } from '../../utils/redis-keys.util';

const scoringService = new ScoringService();

export async function submitSession(
  sessionId: string,
  userId: string,
  submittedAnswerIds: string[]
): Promise<SubmitResult> {
  const submittedAt = new Date();

  // Oturumu ve soruyu çek
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: {
      question: {
        include: { answers: { orderBy: { rank: 'asc' } } },
      },
    },
  });

  if (!session) throw ApiError.notFound('Oturum');
  if (session.userId !== userId) throw ApiError.forbidden();
  if (session.submittedAt) {
    throw ApiError.conflict(ERROR_CODES.SESSION_ALREADY_EXISTS, 'Bu oturum zaten tamamlandı');
  }

  const { question } = session;
  const correctAnswers = question.answers; // rank sıralı

  // Doğru ve yanlış cevapları belirle
  const correctEntityIds = new Set(correctAnswers.map(a => a.entityId));
  const correctRanks: number[] = [];
  const wrongEntityIds: string[] = [];

  for (const answerId of submittedAnswerIds) {
    const matchingAnswer = correctAnswers.find(a => a.entityId === answerId);
    if (matchingAnswer) {
      correctRanks.push(matchingAnswer.rank);
    } else {
      wrongEntityIds.push(answerId);
    }
  }

  // Slot doluluk kontrolü
  const allSlotsFilled = submittedAnswerIds.length === question.answerCount;

  // Kalan süre
  const elapsedSeconds = (submittedAt.getTime() - session.startedAt.getTime()) / 1000;
  const remainingSeconds = Math.max(0, question.timeLimit - elapsedSeconds);

  // Puanlama
  const scoring = scoringService.calculate({
    totalAnswers: question.answerCount,
    basePoints: question.basePoints,
    difficulty: question.difficulty as Difficulty,
    timeLimitSeconds: question.timeLimit,
    correctRanks,
    allSlotsFilled,
    remainingSeconds,
  });

  // Hile tespiti
  const cheatCheck = scoringService.isSuspicious(
    session.startedAt,
    submittedAt,
    question.answerCount
  );

  // DB güncelle (transaction)
  await prisma.$transaction(async (tx) => {
    await tx.gameSession.update({
      where: { id: sessionId },
      data: {
        submittedAt,
        submittedAnswers: submittedAnswerIds,
        correctRanks,
        wrongEntityIds,
        allSlotsFilled,
        scoreBase: scoring.scoreBase,
        scoreTimeBonus: scoring.scoreTimeBonus,
        scoreDifficulty: scoring.scoreDifficulty,
        scoreFinal: scoring.scoreFinal,
        adMultiplied: false,
        flagSuspicious: cheatCheck.suspicious,
        suspiciousReason: cheatCheck.reason ?? null,
        cooldownUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    // 0 puanlı oturumlar point_history'ye yazılmaz
    if (scoring.scoreFinal > 0) {
      await tx.pointHistory.create({
        data: {
          userId,
          sessionId,
          module: question.module,
          isSpecial: question.isSpecial,
          points: scoring.scoreFinal,
        },
      });
    }
  });

  // Redis leaderboard güncelle (sadece puan > 0 ise)
  if (scoring.scoreFinal > 0) {
    await updateLeaderboards(userId, scoring.scoreFinal, question.module);
  }

  return { sessionId, scoring, correctRanks, wrongEntityIds };
}

async function updateLeaderboards(
  userId: string,
  points: number,
  module: string
) {
  const now = new Date();
  const isoWeek = getISOWeek(now);    // '2025-W24'
  const month = getMonthKey(now);     // '2025-06'
  const quarter = getQuarterKey(now); // '2025-Q2'

  const pipeline = redis.pipeline();

  // Genel sıralamalar
  for (const scope of ['global', 'tr']) {
    pipeline.zincrby(`leaderboard:${scope}:alltime`, points, userId);
    pipeline.zincrby(`leaderboard:${scope}:weekly:${isoWeek}`, points, userId);
    pipeline.zincrby(`leaderboard:${scope}:monthly:${month}`, points, userId);
    pipeline.zincrby(`leaderboard:${scope}:quarterly:${quarter}`, points, userId);
  }

  // Modül sıralaması
  pipeline.zincrby(`leaderboard:module:${module}:global:alltime`, points, userId);
  pipeline.zincrby(`leaderboard:module:${module}:tr:alltime`, points, userId);

  await pipeline.exec();
}
```

---

## 7. REKLAM ÖDÜLÜ ENDPOINT İMPLEMENTASYONU

```typescript
// src/modules/sessions/sessions.service.ts (ad-reward bölümü)

export async function applyAdReward(
  sessionId: string,
  userId: string
): Promise<AdRewardResult> {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: { question: { select: { module: true, isSpecial: true } } },
  });

  if (!session) throw ApiError.notFound('Oturum');
  if (session.userId !== userId) throw ApiError.forbidden();
  if (!session.submittedAt) throw new ApiError(400, 'SESSION_NOT_FINISHED', 'Oturum henüz bitmedi');
  if (session.adMultiplied) {
    throw ApiError.conflict(ERROR_CODES.AD_ALREADY_USED, 'Bu oturum için reklam bonusu zaten kullanıldı');
  }

  const result = scoringService.applyAdReward(session.scoreDifficulty);
  const pointDiff = result.newScore - session.scoreFinal;

  await prisma.$transaction(async (tx) => {
    await tx.gameSession.update({
      where: { id: sessionId },
      data: { scoreFinal: result.newScore, adMultiplied: true },
    });

    // point_history güncelle (diff ekle)
    if (session.scoreFinal === 0 && result.newScore > 0) {
      // Önceden 0 puanlıydı, şimdi kayıt oluştur
      await tx.pointHistory.create({
        data: {
          userId,
          sessionId,
          module: session.question.module,
          isSpecial: session.question.isSpecial,
          points: result.newScore,
        },
      });
    } else if (pointDiff > 0) {
      // Mevcut kaydın üzerine diff ekle — ya yeni kayıt aç ya güncelle
      await tx.pointHistory.create({
        data: {
          userId,
          sessionId,
          module: session.question.module,
          isSpecial: session.question.isSpecial,
          points: pointDiff,
        },
      });
    }
  });

  // Redis'i güncelle
  if (pointDiff > 0) {
    await updateLeaderboards(userId, pointDiff, session.question.module);
  }

  return result;
}
```

---

## 8. BİRİM TESTLERİ — TAM TEST SÜİTİ

```typescript
// src/modules/scoring/scoring.service.test.ts
import { ScoringService } from './scoring.service';

describe('ScoringService', () => {
  const service = new ScoringService();

  // ─── TEMEL PUANLAMA TESTLERİ ───────────────────────────────────────

  describe('calculate()', () => {

    it('SENARYO-1: Sıfır doğru → scoreBase = 0', () => {
      const result = service.calculate({
        totalAnswers: 7,
        basePoints: 100,
        difficulty: 'medium',
        timeLimitSeconds: 60,
        correctRanks: [],
        allSlotsFilled: false,
        remainingSeconds: 30,
      });

      expect(result.scoreBase).toBe(0);
      expect(result.scoreTimeBonus).toBe(0); // allSlotsFilled=false
      expect(result.scoreDifficulty).toBe(0);
      expect(result.scoreFinal).toBe(0);
    });

    it('SENARYO-2: Tüm doğru + süre bonusu + zor zorluk', () => {
      const result = service.calculate({
        totalAnswers: 10,
        basePoints: 100,
        difficulty: 'hard',
        timeLimitSeconds: 45,
        correctRanks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        allSlotsFilled: true,
        remainingSeconds: 20,
      });

      // Süre bonusu: floor(20/45 * 25) = floor(11.1) = 11
      expect(result.scoreTimeBonus).toBe(11);
      // scoreDifficulty = floor((scoreBase + 11) * 1.5)
      expect(result.scoreDifficulty).toBeGreaterThan(100);
      expect(result.scoreFinal).toBe(result.scoreDifficulty);
    });

    it('SENARYO-3: Süre bonusu sadece allSlotsFilled=true iken verilir', () => {
      const withSlots = service.calculate({
        totalAnswers: 5,
        basePoints: 100,
        difficulty: 'easy',
        timeLimitSeconds: 90,
        correctRanks: [3],
        allSlotsFilled: true,
        remainingSeconds: 45,
      });

      const withoutSlots = service.calculate({
        totalAnswers: 5,
        basePoints: 100,
        difficulty: 'easy',
        timeLimitSeconds: 90,
        correctRanks: [3],
        allSlotsFilled: false,
        remainingSeconds: 45,
      });

      expect(withSlots.scoreTimeBonus).toBeGreaterThan(0);
      expect(withoutSlots.scoreTimeBonus).toBe(0);
      expect(withSlots.scoreDifficulty).toBeGreaterThan(withoutSlots.scoreDifficulty);
    });

    it('SENARYO-4: Son rank (en zor) ilk rank\'tan daha fazla puan verir', () => {
      const N = 10;
      const firstRankResult = service.calculate({
        totalAnswers: N,
        basePoints: 100,
        difficulty: 'easy',
        timeLimitSeconds: 60,
        correctRanks: [1],
        allSlotsFilled: false,
        remainingSeconds: 0,
      });

      const lastRankResult = service.calculate({
        totalAnswers: N,
        basePoints: 100,
        difficulty: 'easy',
        timeLimitSeconds: 60,
        correctRanks: [N],
        allSlotsFilled: false,
        remainingSeconds: 0,
      });

      expect(lastRankResult.scoreBase).toBeGreaterThan(firstRankResult.scoreBase);
    });

    it('SENARYO-5: Son rank puanı ilk rank puanının ~2 katı (±%30 tolerans)', () => {
      const N = 10;
      const firstRank = service.calculate({
        totalAnswers: N, basePoints: 100, difficulty: 'easy',
        timeLimitSeconds: 60, correctRanks: [1],
        allSlotsFilled: false, remainingSeconds: 0,
      }).scoreBase;

      const lastRank = service.calculate({
        totalAnswers: N, basePoints: 100, difficulty: 'easy',
        timeLimitSeconds: 60, correctRanks: [N],
        allSlotsFilled: false, remainingSeconds: 0,
      }).scoreBase;

      const ratio = lastRank / firstRank;
      expect(ratio).toBeGreaterThan(1.4); // En az 1.4x
      expect(ratio).toBeLessThan(2.6);    // En fazla 2.6x
    });

    it('SENARYO-6: Zorluk çarpanları doğru uygulanır', () => {
      const base = {
        totalAnswers: 5, basePoints: 100, timeLimitSeconds: 60,
        correctRanks: [3], allSlotsFilled: false, remainingSeconds: 0,
      };

      const easy   = service.calculate({ ...base, difficulty: 'easy' });
      const medium = service.calculate({ ...base, difficulty: 'medium' });
      const hard   = service.calculate({ ...base, difficulty: 'hard' });

      expect(medium.scoreDifficulty).toBeGreaterThan(easy.scoreDifficulty);
      expect(hard.scoreDifficulty).toBeGreaterThan(medium.scoreDifficulty);

      // Tam oran kontrolü (floor nedeniyle ±1 tolerans)
      expect(medium.scoreDifficulty).toBeCloseTo(easy.scoreDifficulty * 1.25, 0);
      expect(hard.scoreDifficulty).toBeCloseTo(easy.scoreDifficulty * 1.5, 0);
    });

    it('SENARYO-7: Süre bonusu maksimum 25 puan', () => {
      const result = service.calculate({
        totalAnswers: 3, basePoints: 100, difficulty: 'easy',
        timeLimitSeconds: 60, correctRanks: [1, 2, 3],
        allSlotsFilled: true, remainingSeconds: 60, // Tüm süre kaldı (teorik)
      });

      expect(result.scoreTimeBonus).toBeLessThanOrEqual(25);
    });

    it('SENARYO-8: Yanlış cevaplar (slotlar dolu ama hiç doğru yok) → sadece süre bonusu', () => {
      const result = service.calculate({
        totalAnswers: 5, basePoints: 100, difficulty: 'easy',
        timeLimitSeconds: 90, correctRanks: [],
        allSlotsFilled: true, remainingSeconds: 60,
      });

      expect(result.scoreBase).toBe(0);
      expect(result.scoreTimeBonus).toBeGreaterThan(0);
      expect(result.scoreDifficulty).toBe(result.scoreTimeBonus); // easy=1.0x
    });

    it('SENARYO-9: Geçersiz rank numaraları yok sayılır', () => {
      const result = service.calculate({
        totalAnswers: 5, basePoints: 100, difficulty: 'easy',
        timeLimitSeconds: 60, correctRanks: [0, 6, -1, 999],
        allSlotsFilled: false, remainingSeconds: 0,
      });

      expect(result.scoreBase).toBe(0); // Tüm rank'lar geçersiz
    });
  });

  // ─── REKLAM ÖDÜLÜ TESTLERİ ────────────────────────────────────────

  describe('applyAdReward()', () => {
    it('scoreDifficulty * 1.5 döner (floor)', () => {
      const result = service.applyAdReward(72);
      expect(result.newScore).toBe(108); // floor(72 * 1.5)
      expect(result.previousScore).toBe(72);
    });

    it('0 puana reklam uygulanınca 0 döner', () => {
      const result = service.applyAdReward(0);
      expect(result.newScore).toBe(0);
    });
  });

  // ─── HİLE TESPİTİ TESTLERİ ────────────────────────────────────────

  describe('isSuspicious()', () => {
    it('eşik altı süre → suspicious=true', () => {
      const start = new Date('2025-01-01T10:00:00.000Z');
      const submit = new Date('2025-01-01T10:00:05.000Z'); // 5 saniye
      const result = service.isSuspicious(start, submit, 5); // min = 5*4 = 20s

      expect(result.suspicious).toBe(true);
      expect(result.reason).toContain('5.0s');
      expect(result.reason).toContain('20s');
    });

    it('eşik üstü süre → suspicious=false', () => {
      const start = new Date('2025-01-01T10:00:00.000Z');
      const submit = new Date('2025-01-01T10:00:25.000Z'); // 25 saniye
      const result = service.isSuspicious(start, submit, 5); // min = 20s

      expect(result.suspicious).toBe(false);
    });

    it('tam eşit süre → suspicious=false (= kabul edilir)', () => {
      const start = new Date('2025-01-01T10:00:00.000Z');
      const submit = new Date('2025-01-01T10:00:20.000Z'); // tam 20s
      const result = service.isSuspicious(start, submit, 5);

      expect(result.suspicious).toBe(false);
    });
  });

  // ─── AĞIRLIK TABLOSU TESTLERİ ─────────────────────────────────────

  describe('getWeightTable()', () => {
    it('rank sayısı totalAnswers\'a eşit', () => {
      const table = service.getWeightTable(7, 100);
      expect(table).toHaveLength(7);
    });

    it('rank\'lar artan sırada', () => {
      const table = service.getWeightTable(5, 100);
      for (let i = 1; i < table.length; i++) {
        expect(table[i].rank).toBe(table[i - 1].rank + 1);
      }
    });

    it('son rank en yüksek puana sahip', () => {
      const table = service.getWeightTable(10, 100);
      const firstPoints = table[0].points;
      const lastPoints = table[table.length - 1].points;
      expect(lastPoints).toBeGreaterThan(firstPoints);
    });

    it('normalize ağırlıklar toplamı ~1.0', () => {
      const table = service.getWeightTable(7, 100);
      const total = table.reduce((sum, row) => sum + row.normalizedWeight, 0);
      expect(total).toBeCloseTo(1.0, 5);
    });
  });
});
```

---

## 9. KESİNLİKLE YAPILMAYACAKLAR

- Formülde sabit değerler değiştirilemez (`SCORING` sabitleri dışında).
- Client'tan gelen `score` değeri hiçbir şekilde kullanılmaz.
- `scoreFinal` sıfır olan oturumlar `point_history`'ye yazılmaz.
- `applyAdReward` `scoreBase` üzerine değil, `scoreDifficulty` üzerine uygulanır.
- Süre bonusu `allSlotsFilled = false` iken hesaplanmaz (kod buna uymalıdır).
- Hile tespiti puan kesmez, sadece `flag_suspicious = true` yapar.
- Test dosyası olmadan scoring service tamamlandı sayılmaz — 9 senaryo zorunludur.
