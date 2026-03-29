---
name: database-patterns
description: Specialized procedural guidance for database-patterns in the Football Challenge project.
---

# SKILL: DATABASE PATTERNS — PRISMA ŞEMA, MİGRASYON, SORGU KALIPLARI

> Bu skill dosyası Football Challenge veritabanı katmanının tam implementasyonunu tanımlar.
> Prisma şeması, tablo ilişkileri, index stratejisi, migration kuralları
> ve sık kullanılan sorgu kalıpları burada belirlenir.
> Ham SQL yazılmaz. Her şey Prisma ORM üzerinden yapılır.

---

## 1. TAM PRİSMA ŞEMASI

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────────────────────────
// ENUM'LAR
// ─────────────────────────────────────────────────────────────────

enum AuthProvider {
  google
  apple
  email
}

enum SubscriptionTier {
  free
  premium
}

enum EntityType {
  player
  club
  national
  manager
}

enum Difficulty {
  easy
  medium
  hard
}

enum QuestionStatus {
  draft
  active
  archiving   // Aktif oturum varken arşivleme isteği
  archived
  special     // Özel etkinlik sorusu
}

enum QuestionModule {
  players
  clubs
  nationals
  managers
}

enum AdminRole {
  super_admin
  editor
  moderator
}

// ─────────────────────────────────────────────────────────────────
// KULLANICI
// ─────────────────────────────────────────────────────────────────

model User {
  id                String           @id @default(cuid())
  email             String?          @unique
  passwordHash      String?
  authProvider      AuthProvider
  authProviderId    String?

  nickname          String           @unique @db.VarChar(20)
  countryCode       String?          @db.Char(2)
  avatarIndex       Int?
  referralCode      String           @unique @db.VarChar(10)
  referredByCode    String?          @db.VarChar(10)

  timezone          String           @default("Europe/Istanbul") @db.VarChar(50)
  dailyAdsWatched   Int              @default(0)
  dailyQuestionsSolved Int           @default(0)

  subscriptionTier  SubscriptionTier @default(free)
  premiumExpiresAt  DateTime?

  isBanned          Boolean          @default(false)
  banSuggested      Boolean          @default(false)
  banSuggestedBy    String?
  banSuggestedAt    DateTime?

  nicknameChangedAt DateTime?
  lastActiveAt      DateTime         @default(now())
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  // İlişkiler
  gameSessions      GameSession[]
  pointHistory      PointHistory[]

  @@index([email])
  @@index([nickname])
  @@index([countryCode])
  @@index([subscriptionTier])
  @@index([isBanned])
  @@index([lastActiveAt])
}

// ─────────────────────────────────────────────────────────────────
// ENTİTY (Oyuncu, Kulüp, Milli Takım, Teknik Direktör)
// ─────────────────────────────────────────────────────────────────

model Entity {
  id          String     @id @default(cuid())
  type        EntityType
  name        String     @db.VarChar(100)
  nameTr      String?    @db.VarChar(100)   // Türkçe karşılık
  countryCode String?    @db.Char(2)
  alias       String[]   @default([])        // Arama için diğer isimler
  imagePath   String?    @db.VarChar(255)    // Göreli yol (CDN prefix eklenir)
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // İlişkiler
  questionAnswers QuestionAnswer[]

  @@index([type])
  @@index([name])
  @@index([isActive])
  // Full-text arama için GIN index (migration'da manuel eklenir)
}

// ─────────────────────────────────────────────────────────────────
// SORU
// ─────────────────────────────────────────────────────────────────

model Question {
  id          String         @id @default(cuid())
  title       String         @db.VarChar(300)
  module      QuestionModule
  category    String?        @db.VarChar(100) // "La Liga", "Premier Lig" vb.
  difficulty  Difficulty
  status      QuestionStatus @default(draft)
  basePoints  Int            @default(100)
  timeLimit   Int            @default(60)     // Saniye
  answerCount Int                             // Kaç cevap bekleniyor

  isSpecial   Boolean        @default(false)  // Özel etkinlik sorusu
  specialEventId String?

  scheduledFor DateTime?     // Programlı yayın tarihi
  publishedAt  DateTime?     // Gerçek yayın tarihi
  archivedAt   DateTime?
  lastShownAt  DateTime?

  createdBy   String         // adminUserId
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  // İlişkiler
  answers          QuestionAnswer[]
  gameSessions     GameSession[]
  dailyAssignments DailyQuestionAssignment[]
  specialEvent     SpecialEvent?  @relation(fields: [specialEventId], references: [id])

  @@index([module, status])
  @@index([status])
  @@index([scheduledFor])
  @@index([isSpecial])
}

// ─────────────────────────────────────────────────────────────────
// SORU CEVAPLARI
// ─────────────────────────────────────────────────────────────────

model QuestionAnswer {
  id          String   @id @default(cuid())
  questionId  String
  entityId    String
  rank        Int      // 1 = kolay (az puan), N = zor (çok puan)
  statValue   String   @db.VarChar(50)   // "192" (ham değer, sıralama için)
  statDisplay String?  @db.VarChar(100)  // "192 asist" (gösterim için, boşsa statValue kullanılır)

  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  entity      Entity   @relation(fields: [entityId], references: [id])

  @@unique([questionId, rank])      // Aynı soruda aynı rank olamaz
  @@unique([questionId, entityId])  // Aynı soruda aynı entity olamaz
  @@index([questionId])
  @@index([entityId])
}

// ─────────────────────────────────────────────────────────────────
// GÜNLÜK SORU ATAMALARI
// ─────────────────────────────────────────────────────────────────

model DailyQuestionAssignment {
  id         String         @id @default(cuid())
  date       DateTime       @db.Date   // Sadece tarih (saat yok)
  module     QuestionModule
  questionId String
  isExtra    Boolean        @default(false)

  question   Question @relation(fields: [questionId], references: [id])

  @@unique([date, module, isExtra])
  @@index([date])
}

// ─────────────────────────────────────────────────────────────────
// OYUN OTURUMU
// ─────────────────────────────────────────────────────────────────

model GameSession {
  id          String   @id @default(cuid())
  userId      String
  questionId  String

  startedAt   DateTime @default(now())
  submittedAt DateTime?

  // Kullanıcının gönderdiği cevaplar (entity ID'leri)
  submittedAnswers String[] @default([])

  // Sonuç
  correctRanks    Int[]    @default([])  // Doğru bilinen rank'lar
  wrongEntityIds  String[] @default([])  // Yanlış girilen entity ID'leri
  allSlotsFilled  Boolean  @default(false)

  // Puanlama
  scoreBase        Int     @default(0)
  scoreTimeBonus   Int     @default(0)
  scoreDifficulty  Int     @default(0)   // scoreBase + timeBonus × difficulty
  scoreFinal       Int     @default(0)   // scoreDifficulty (× 1.5 reklam sonrası)
  adMultiplied     Boolean @default(false)

  // Hile tespiti
  flagSuspicious  Boolean @default(false)
  suspiciousReason String?

  // Cooldown
  cooldownUntil   DateTime?  // 90 gün sonrası

  createdAt       DateTime   @default(now())

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  question Question @relation(fields: [questionId], references: [id])

  @@unique([userId, questionId])   // Aynı kullanıcı aynı soruyu birden fazla oynayamaz (cooldown süresi bitmeden)
  @@index([userId])
  @@index([questionId])
  @@index([submittedAt])
  @@index([flagSuspicious])
  @@index([cooldownUntil])
}

// ─────────────────────────────────────────────────────────────────
// PUAN GEÇMİŞİ
// ─────────────────────────────────────────────────────────────────

model PointHistory {
  id        String         @id @default(cuid())
  userId    String
  sessionId String
  module    QuestionModule
  isSpecial Boolean        @default(false)
  points    Int

  createdAt DateTime       @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
  @@index([module])
}

// ─────────────────────────────────────────────────────────────────
// LEADERBOARD SNAPSHOT
// ─────────────────────────────────────────────────────────────────

model LeaderboardSnapshot {
  id         String   @id @default(cuid())
  period     String   @db.VarChar(20)   // 'weekly' | 'monthly' | 'quarterly'
  periodKey  String   @db.VarChar(20)   // '2025-W24' | '2025-06' | '2025-Q2'
  scope      String   @db.VarChar(10)   // 'global' | 'tr'
  snapshotAt DateTime

  // JSON: Array<{ rank, userId, nickname, score }>
  rankings   Json

  @@unique([period, periodKey, scope])
  @@index([period, scope])
  @@index([snapshotAt])
}

// ─────────────────────────────────────────────────────────────────
// ÖZEL ETKİNLİK
// ─────────────────────────────────────────────────────────────────

model SpecialEvent {
  id          String   @id @default(cuid())
  name        String   @db.VarChar(100)
  description String?
  icon        String?  @db.VarChar(10)
  colorHex    String?  @db.VarChar(7)
  startsAt    DateTime
  endsAt      DateTime
  isActive    Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // İlişkiler
  questions   Question[]

  @@index([isActive])
  @@index([startsAt, endsAt])
}

// ─────────────────────────────────────────────────────────────────
// ADMİN KULLANICI
// ─────────────────────────────────────────────────────────────────

model AdminUser {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  role         AdminRole @default(moderator)
  isActive     Boolean   @default(true)

  createdById  String?
  createdBy    AdminUser?  @relation("AdminCreator", fields: [createdById], references: [id])
  createdAdmins AdminUser[] @relation("AdminCreator")

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([email])
  @@index([role])
}

// ─────────────────────────────────────────────────────────────────
// UYGULAMA KONFİGÜRASYONU
// ─────────────────────────────────────────────────────────────────

model AppConfig {
  id              Int      @id @default(1)
  minimum_version String   @default("1.0.0")
  latest_version  String   @default("1.0.0")
  force_update    Boolean  @default(false)
  activeEventId   String?
  updatedAt       DateTime @updatedAt
}

```

---

## 2. MIGRATION KURALLARI

### Temel Kurallar

1. `prisma migrate dev` sadece geliştirme ortamında çalıştırılır.
2. Production'a `prisma migrate deploy` ile uygulanır.
3. Migration dosyaları git'e commit edilir — asla silinmez.
4. Migration adlandırma: `YYYYMMDDHHMMSS_kısa_açıklama` formatında otomatik üretilir.

### Full-Text Search Index (Manuel Migration)

Türkçe karakter normalizasyonu için GIN index manuel eklenir:

```sql
-- prisma/migrations/20250101000001_add_entity_fts/migration.sql

-- Türkçe karakterleri normalize eden immutable fonksiyon
CREATE OR REPLACE FUNCTION normalize_turkish(text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(
    translate(
      $1,
      'ğĞüÜşŞıİöÖçÇ',
      'gGüÜsSiIoOcC'
    )
  );
$$;

-- Entity adı üzerinde GIN index (normalize edilmiş)
CREATE INDEX entity_name_fts_idx ON "Entity"
USING GIN (to_tsvector('simple', normalize_turkish(name)));

-- Alias dizisi üzerinde GIN index
CREATE INDEX entity_alias_gin_idx ON "Entity"
USING GIN (alias);
```

### GameSession Unique Constraint Notu

`@@unique([userId, questionId])` constraint'i 90 günlük cooldown mantığını **veritabanı seviyesinde** garanti etmez. Cooldown kontrolü servis katmanında yapılır. Bu constraint sadece aynı anda iki oturum oluşturulmasını engeller.

```typescript
// Cooldown kontrolü örneği
const existingSession = await prisma.gameSession.findFirst({
  where: {
    userId,
    questionId,
    cooldownUntil: { gt: new Date() },
  },
});

if (existingSession) {
  throw ApiError.conflict('QUESTION_ON_COOLDOWN', 'Bu soru 90 gün sonra tekrar oynanabilir');
}
```

---

## 3. SORGU KALIPLARI

### 3.1 Günlük Soru Çekme

```typescript
// Bugünün sorularını modül bazında getir
async function getDailyQuestions(userId: string, today: Date) {
  const dateOnly = new Date(today.toISOString().split('T')[0]); // Saat kaldır

  const assignments = await prisma.dailyQuestionAssignment.findMany({
    where: { date: dateOnly },
    include: {
      question: {
        select: {
          id: true,
          module: true,
          difficulty: true,
          timeLimit: true,
          answerCount: true,
          isSpecial: true,
          specialEventId: true,
          // Başlık bu sorgu dahilinde döndürülmez (soru spoiler önleme)
        },
      },
    },
  });

  // Kullanıcının bugün hangi soruları oynadığını kontrol et
  const questionIds = assignments.map(a => a.questionId);
  const completedSessions = await prisma.gameSession.findMany({
    where: {
      userId,
      questionId: { in: questionIds },
      submittedAt: { not: null },
    },
    select: { questionId: true, scoreFinal: true },
  });

  const completedMap = new Map(
    completedSessions.map(s => [s.questionId, s.scoreFinal])
  );

  return assignments.map(a => ({
    id: a.questionId,
    module: a.question.module,
    difficulty: a.question.difficulty,
    timeLimitSeconds: a.question.timeLimit,
    answerCount: a.question.answerCount,
    isSpecial: a.question.isSpecial,
    isCompleted: completedMap.has(a.questionId),
    myScore: completedMap.get(a.questionId) ?? null,
  }));
}
```

### 3.2 Entity Arama (Full-Text + Alias)

```typescript
// src/modules/search/search.service.ts

async function searchEntities(
  query: string,
  type?: string,
  limit = 6
): Promise<SearchResult[]> {
  const normalized = normalizeText(query); // Türkçe → ASCII

  // PostgreSQL full-text search + alias eşleşmesi
  const results = await prisma.$queryRaw<SearchResult[]>`
    SELECT
      e.id          AS "entityId",
      e.name,
      e."countryCode",
      e.type        AS "entityType",
      -- Kulüp adını sadece oyuncu tipinde döndür
      NULL          AS "clubName"
    FROM "Entity" e
    WHERE
      e."isActive" = true
      ${type ? prisma.sql`AND e.type = ${type}::\"EntityType\"` : prisma.sql``}
      AND (
        normalize_turkish(e.name) ILIKE ${'%' + normalized + '%'}
        OR EXISTS (
          SELECT 1 FROM unnest(e.alias) AS a
          WHERE normalize_turkish(a) ILIKE ${'%' + normalized + '%'}
        )
      )
    ORDER BY
      -- Tam eşleşmeler önce gelir
      CASE WHEN normalize_turkish(e.name) = ${normalized} THEN 0 ELSE 1 END,
      e.name ASC
    LIMIT ${limit}
  `;

  return results;
}

// Türkçe karakter normalizasyonu (Node.js tarafı)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/Ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/İ/g, 'i')
    .replace(/Ö/g, 'o')
    .replace(/Ç/g, 'c');
}
```

### 3.3 Sonuç Ekranı için Session Detayı

```typescript
// Blur mantığı dahil session sonucunu getir
async function getSessionResult(
  sessionId: string,
  userId: string
): Promise<SessionResult> {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: {
      user: { select: { subscriptionTier: true } },
      question: {
        include: {
          answers: {
            orderBy: { rank: 'asc' },
            include: {
              entity: {
                select: { name: true, countryCode: true },
              },
            },
          },
        },
      },
    },
  });

  if (!session) throw ApiError.notFound('Oturum');
  if (session.userId !== userId) throw ApiError.forbidden();

  const isPremium = session.user.subscriptionTier === 'premium';
  const correctRankSet = new Set(session.correctRanks);

  // Cevap satırları
  const answers = session.question.answers.map(answer => {
    const isCorrect = correctRankSet.has(answer.rank);
    const isBlurred = !isCorrect && !isPremium;

    return {
      rank: answer.rank,
      status: isCorrect ? 'correct' : isBlurred ? 'blurred' : 'wrong',
      entityName: isBlurred ? null : answer.entity.name,
      statDisplay: isBlurred ? null : (answer.statDisplay ?? answer.statValue),
      countryCode: isBlurred ? null : answer.entity.countryCode,
    };
  });

  // Yanlış girilen entity isimleri
  const wrongEntities = session.wrongEntityIds.length > 0
    ? await prisma.entity.findMany({
        where: { id: { in: session.wrongEntityIds } },
        select: { name: true },
      })
    : [];

  return {
    sessionId: session.id,
    correctCount: session.correctRanks.length,
    totalCount: session.question.answerCount,
    scoreBase: session.scoreBase,
    scoreTimeBonus: session.scoreTimeBonus,
    scoreDifficulty: session.scoreDifficulty,
    scoreFinal: session.scoreFinal,
    adMultiplied: session.adMultiplied,
    answers,
    wrongEntityNames: wrongEntities.map(e => e.name),
  };
}
```

### 3.4 Admin Dashboard İstatistikleri

```typescript
// Bugünün metriklerini hesapla
async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    todaySessions,
    activeUsers,
    suspiciousCount,
    poolHealth,
  ] = await Promise.all([
    // Bugünkü oturumlar
    prisma.gameSession.aggregate({
      where: { createdAt: { gte: today, lt: tomorrow } },
      _count: { id: true },
      _avg: { scoreFinal: true },
    }),

    // Aktif kullanıcı sayısı (son 7 günde giriş yapan)
    prisma.user.count({
      where: { lastActiveAt: { gte: sevenDaysAgo } },
    }),

    // Bugünkü şüpheli oturum sayısı
    prisma.gameSession.count({
      where: {
        createdAt: { gte: today, lt: tomorrow },
        flagSuspicious: true,
      },
    }),

    // Modül başına havuz sağlığı
    prisma.question.groupBy({
      by: ['module'],
      where: { status: { notIn: ['archived', 'archiving'] } },
      _count: { id: true },
    }),
  ]);

  // Tamamlama oranı: submitted / started
  const startedCount = await prisma.gameSession.count({
    where: { createdAt: { gte: today, lt: tomorrow } },
  });
  const finishedCount = await prisma.gameSession.count({
    where: {
      createdAt: { gte: today, lt: tomorrow },
      submittedAt: { not: null },
    },
  });
  const completionRate = startedCount > 0
    ? Math.round((finishedCount / startedCount) * 100)
    : 0;

  return {
    today: {
      sessions: todaySessions._count.id,
      activeUsers,
      completionRate,
      avgScore: todaySessions._avg.scoreFinal ?? 0,
    },
    suspiciousCount,
    poolHealth: poolHealth.map(p => ({
      module: p.module,
      count: p._count.id,
      label: MODULE_LABELS[p.module] ?? p.module,
    })),
  };
}
```

### 3.5 Soru Arşivleme (Soft)

```typescript
// Aktif oturum varsa status='archiving', yoksa 'archived' yap
async function archiveQuestion(questionId: string): Promise<'archived' | 'archiving'> {
  const activeSessionCount = await prisma.gameSession.count({
    where: {
      questionId,
      submittedAt: null, // Henüz bitmemiş oturumlar
      startedAt: {
        // Son 10 dakikada başlamış oturumlar
        gte: new Date(Date.now() - 10 * 60 * 1000),
      },
    },
  });

  if (activeSessionCount > 0) {
    await prisma.question.update({
      where: { id: questionId },
      data: { status: 'archiving' },
    });
    return 'archiving';
  }

  await prisma.question.update({
    where: { id: questionId },
    data: { status: 'archived', archivedAt: new Date() },
  });
  return 'archived';
}
```

### 3.6 Havuz Sağlığı Kontrolü

```typescript
// Modül başına kullanılabilir soru sayısını döner
async function getPoolHealth(): Promise<Record<string, number>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 90 gün sonrası — cooldown içinde olan sorular
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Kullanılabilir: active durumunda ve bugün atanmamış sorular
  const available = await prisma.question.groupBy({
    by: ['module'],
    where: {
      status: 'active',
      isSpecial: false,
      // Bugün atanmış değil
      dailyAssignments: {
        none: {
          date: { gte: today },
        },
      },
    },
    _count: { id: true },
  });

  const result: Record<string, number> = {
    players: 0, clubs: 0, nationals: 0, managers: 0,
  };

  available.forEach(row => {
    result[row.module] = row._count.id;
  });

  return result;
}
```

### 3.7 Kullanıcı İstatistikleri (Profil Ekranı)

```typescript
async function getUserStats(userId: string) {
  const [totalStats, moduleStats] = await Promise.all([
    // Genel istatistikler
    prisma.pointHistory.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: { points: true },
      _avg: { points: true },
    }),

    // Modül bazlı istatistikler
    prisma.pointHistory.groupBy({
      by: ['module'],
      where: { userId },
      _count: { id: true },
      _sum: { points: true },
    }),
  ]);

  // Doğruluk oranı için game_sessions tablosundan hesapla
  const sessions = await prisma.gameSession.findMany({
    where: { userId, submittedAt: { not: null } },
    select: { correctRanks: true, question: { select: { answerCount: true } } },
  });

  let totalCorrect = 0;
  let totalExpected = 0;
  for (const s of sessions) {
    totalCorrect += s.correctRanks.length;
    totalExpected += s.question.answerCount;
  }

  const accuracyRate = totalExpected > 0
    ? Math.round((totalCorrect / totalExpected) * 100)
    : 0;

  return {
    totalScore: totalStats._sum.points ?? 0,
    totalSessions: totalStats._count.id,
    avgScore: Math.round(totalStats._avg.points ?? 0),
    accuracyRate,
    byModule: moduleStats.map(m => ({
      module: m.module,
      sessions: m._count.id,
      totalScore: m._sum.points ?? 0,
    })),
  };
}
```

---

## 4. TRANSACTION KALIPLARI

### Session Submit Transaction

```typescript
// Tüm submit işlemleri tek transaction içinde yapılır
// Kısmi başarı olmaz — ya hepsi yazılır ya hiçbiri
await prisma.$transaction(async (tx) => {
  // 1. GameSession güncelle
  await tx.gameSession.update({
    where: { id: sessionId },
    data: {
      submittedAt: new Date(),
      correctRanks,
      wrongEntityIds,
      allSlotsFilled,
      scoreBase,
      scoreTimeBonus,
      scoreDifficulty,
      scoreFinal,
      cooldownUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  // 2. Puan geçmişi — sadece puan > 0 ise
  if (scoreFinal > 0) {
    await tx.pointHistory.create({
      data: { userId, sessionId, module, points: scoreFinal },
    });
  }
  // 3. Redis güncellemesi transaction dışında yapılır (Redis + Prisma aynı transaction'da olamaz)
});
// Transaction sonrası Redis güncellemesi
await updateLeaderboards(userId, scoreFinal, module);
```

### Özel Etkinlik Aktivasyonu (Tek Aktif Kural)

```typescript
// Tek seferde: var olan aktif etkinliği pasife al, yenisini aktif et
await prisma.$transaction(async (tx) => {
  // Mevcut aktifi kapat
  await tx.specialEvent.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  // Yeni etkinliği aç
  await tx.specialEvent.update({
    where: { id: eventId },
    data: { isActive: true },
  });
});
```

---

## 5. SELECT KALIPLARI — SADECE GEREKLİ ALANLAR

```typescript
// ❌ YANLIŞ — tüm alanları çekme
const user = await prisma.user.findUnique({ where: { id } });

// ✅ DOĞRU — sadece gerekli alanlar
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    nickname: true,
    countryCode: true,
    subscriptionTier: true,
  },
});

// ❌ YANLIŞ — N+1 sorgu
const sessions = await prisma.gameSession.findMany({ where: { userId } });
for (const s of sessions) {
  const question = await prisma.question.findUnique({ where: { id: s.questionId } });
  // ...
}

// ✅ DOĞRU — include ile tek sorgu
const sessions = await prisma.gameSession.findMany({
  where: { userId },
  include: {
    question: {
      select: { module: true, difficulty: true, answerCount: true },
    },
  },
});
```

---

## 6. PAGİNASYON KALIPLARI

```typescript
// Cursor-based paginate (büyük tablolar için)
async function getUsersPaginated(params: {
  cursor?: string;
  limit?: number;
  search?: string;
}) {
  const { cursor, limit = 50, search } = params;

  const users = await prisma.user.findMany({
    take: limit + 1, // +1 → sonraki sayfa var mı kontrol et
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    where: search ? {
      OR: [
        { nickname: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    } : undefined,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, nickname: true, email: true,
      countryCode: true, isBanned: true,
      flagSuspicious: false, // Computed field değil, direkt alan
    },
  });

  const hasNextPage = users.length > limit;
  const items = hasNextPage ? users.slice(0, -1) : users;
  const nextCursor = hasNextPage ? items[items.length - 1].id : null;

  return { items, nextCursor, hasNextPage };
}

// Offset-based paginate (admin panel tabloları için)
async function getQuestionsPaginated(params: {
  page?: number;
  limit?: number;
  module?: string;
  status?: string;
}) {
  const { page = 0, limit = 20, module, status } = params;

  const where = {
    ...(module ? { module: module as QuestionModule } : {}),
    ...(status ? { status: status as QuestionStatus } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.question.findMany({
      where,
      skip: page * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, module: true,
        difficulty: true, status: true,
        answerCount: true, timeLimit: true,
        createdAt: true,
      },
    }),
    prisma.question.count({ where }),
  ]);

  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

---

## 7. INDEX STRATEJİSİ

```
Tablo               Index                     Neden
──────────────────────────────────────────────────────────────────
User                email                     Login sorgusu
User                nickname                  Nickname kontrol
User                countryCode               TR filtresi
User                lastActiveAt              Aktif kullanıcı metrikleri
User                isBanned                  Ban kontrolü

Entity              type                      Modül filtresi
Entity              name (GIN FTS)            Arama
Entity              isActive                  Aktif filtresi

Question            (module, status)          Günlük atama + liste
Question            scheduledFor              Programlı yayın

QuestionAnswer      questionId                Soru cevapları
QuestionAnswer      entityId                  Entity kullanım sayısı

GameSession         userId                    Kullanıcı geçmişi
GameSession         (userId, questionId)      Cooldown kontrolü
GameSession         submittedAt               Günlük istatistik
GameSession         flagSuspicious            Şüpheli raporlama
GameSession         cooldownUntil             Cooldown cleanup cron

PointHistory        userId                    Kullanıcı puanı
PointHistory        createdAt                 Dönem hesaplama

DailyQuestionAssig. date                      Günlük soru çekme

LeaderboardSnapshot (period, scope)           Snapshot sorgulama
```

---

## 8. KESİNLİKLE YAPILMAYACAKLAR

- Ham SQL (`$queryRaw`) sadece full-text search için kullanılır. Diğer her şey Prisma ORM.
- `findMany` sonuçları üzerinde JavaScript döngüsüyle tek tek `findUnique` yapılmaz (N+1). Her zaman `include` veya `findMany + in` kullanılır.
- Tüm alanlar çekilmez. Her sorguda `select` ile sadece gereken alanlar istenir.
- Transaction gerektiren işlemler (submit, etkinlik aktivasyonu) `$transaction` dışında yazılmaz.
- Redis güncellemesi Prisma transaction içine dahil edilmez — transaction sonrası yapılır.
- Migration dosyaları elle düzenlenmez veya silinmez.
- `prisma.question.deleteMany` gibi toplu silme işlemleri admin panel dışında kullanılmaz.
- Şifreler, token'lar veya hassas veriler `select` ile asla döndürülmez.
- `passwordHash` alanı hiçbir API response'unda yer almaz.
