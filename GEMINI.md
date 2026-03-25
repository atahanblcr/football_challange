# FOOTBALL CHALLENGE — GEMINI MASTER DOKÜMANTASYONU

> Bu dosya projenin tek gerçek kaynağıdır. Her oturumda ilk okunacak dosya budur.
> Burada yazılan her kural, kararlaştırılmış ve kesinleşmiştir. Gemini kendi inisiyatifiyle
> bunların dışına çıkamaz, alternatif öneri sunamaz. Öneri sunmak istiyorsa önce sorar.

---

## 1. PROJE KİMLİĞİ

| Alan | Değer |
|---|---|
| Proje Adı | Football Challenge |
| Tip | Mobil bilgi yarışması uygulaması |
| Platform | iOS + Android (Flutter), Admin Paneli (React Web) |
| Dil | Türkçe (MVP). i18n altyapısı kurulur, aktif dil sadece `tr`. |
| Para Birimi | Türk Lirası (TL) |
| Saat Dilimi | UTC+3 (Europe/Istanbul) — tüm cron ve sıfırlama işlemleri buna göre |
| Repo Yapısı | Monorepo |

---

## 2. PROJE AMACI VE YAŞAM DÖNGÜSÜ

Kullanıcıya istatistiksel bir futbol sorusu verilir.
Örnek: _"La Liga'da 2000 sonrası en fazla asist yapan 7 futbolcuyu bul."_

Kullanıcı autocomplete destekli arama kutusuyla cevaplarını girer.
Süre dolduğunda veya kullanıcı "Bitir" dediğinde sonuç ekranı açılır.
Doğru bildiği cevaplar gösterilir. Bilinemeyen cevaplar **kalıcı blur** ile gizlenir.
Puan hesaplanır. Leaderboard gerçek zamanlı güncellenir.

**Hedef Kitle:** 18-35 yaş, futbol takipçisi, rekabetçi kullanıcılar.

**Büyüme Stratejisi (MVP):** App Store / Play Store organik arama + referral kodu kaydı (ödülsüz, sadece analitik).

**Kritik Lansman Tarihi:** FIFA Dünya Kupası 2026 başlamadan 15 gün önce (≈ Mayıs 2026 sonu). App Store başvurusu ret riskini hesaba katarak en geç Mayıs başında yapılmalıdır.

---

## 3. TEKNOLOJİ YIĞINI (STACK)

### 3.1 Mobil — Flutter

| Paket | Versiyon | Amaç |
|---|---|---|
| `flutter_riverpod` | ^2.5.0 | State management |
| `go_router` | ^13.0.0 | Navigasyon |
| `dio` | ^5.4.0 | HTTP client |
| `hive_flutter` | ^1.1.0 | Structured local cache |
| `shared_preferences` | ^2.2.0 | Basit key-value cache |
| `flutter_secure_storage` | ^9.0.0 | JWT refresh token (şifreli) |
| `google_sign_in` | ^6.2.0 | Google OAuth |
| `sign_in_with_apple` | ^6.1.0 | Apple OAuth (iOS zorunlu) |
| `google_mobile_ads` | ^4.0.0 | AdMob reklam |
| `intl` | ^0.19.0 | i18n altyapısı |
| `flutter_animate` | ^4.5.0 | Animasyonlar |
| `cached_network_image` | ^3.3.0 | Görsel cache |
| `package_info_plus` | ^6.0.0 | Force update için versiyon okuma |

**Flutter kanalı:** `stable`. Breaking update'lere karşı `pubspec.lock` commit'lenir.

### 3.2 Backend — Node.js + TypeScript

- **Framework:** Express.js
- **ORM:** Prisma
- **Validation:** Zod
- **Auth:** JWT (access: 15 dakika, refresh: 30 gün)
- **Cron:** `node-cron`
- **Test:** Jest + Supertest

### 3.3 Admin Paneli — React

- **Build:** Vite
- **UI:** Tailwind CSS + shadcn/ui
- **State:** TanStack Query
- **Tablo/Form:** React Hook Form + Zod

### 3.4 Veritabanı ve Altyapı

| Servis | Amaç | Başlangıç Planı |
|---|---|---|
| PostgreSQL (Supabase) | Ana veritabanı | Free tier → kullanıcı artışına göre Pro |
| Redis (Upstash) | Leaderboard + autocomplete cache | Free tier → gerekirse ücretli |
| Supabase Auth | Google + Apple OAuth | Dahil |
| Supabase Storage | Entity görselleri | `image_path` saklanır, URL runtime'da üretilir |
| Railway | Backend hosting | Starter → WC öncesi ölçeklendir |
| Vercel | Admin panel hosting | Free tier |
| AdMob | Reklam ağı | Başlangıç. Trafik artınca mediation ekle |

---

## 4. MİMARİ GENEL BAKIŞ

```
football-challenge/          ← Monorepo kök
├── mobile/                  ← Flutter (iOS + Android)
├── backend/                 ← Node.js + TypeScript API
├── admin/                   ← React web admin paneli
└── shared/                  ← Ortak tip tanımları ve sabitler
```

**Temel Kural:** Tüm iş mantığı backend'de çalışır. Flutter'a güvenilmez.
Puanlama, hile tespiti, cooldown hesabı, sıralama — hepsi sunucu taraflıdır.

---

## 5. VERİTABANI ŞEMASI (TAM)

### 5.1 Enum Tipleri

```sql
CREATE TYPE entity_type_enum AS ENUM ('player', 'club', 'national_team', 'manager');
CREATE TYPE module_enum AS ENUM ('players', 'clubs', 'nationals', 'managers');
CREATE TYPE difficulty_enum AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE question_status_enum AS ENUM ('draft', 'active', 'archiving', 'archived');
```

### 5.2 `entities` — Aranabilir Varlıklar

```sql
CREATE TABLE entities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(200) NOT NULL,
  name_tr       VARCHAR(200),
  aliases       TEXT[],                    -- ['Messi', 'Leo Messi', 'La Pulga']
  entity_type   entity_type_enum NOT NULL,
  country_code  CHAR(2),                   -- ISO 3166-1 alpha-2
  image_path    TEXT,                      -- göreceli yol, CDN prefix runtime'da eklenir
  metadata      JSONB,                     -- esnek ek veri
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_entities_fts ON entities
  USING gin(to_tsvector('simple', name || ' ' || COALESCE(array_to_string(aliases, ' '), '')));
CREATE INDEX idx_entities_type ON entities(entity_type);
```

### 5.3 `questions` — Sorular

```sql
CREATE TABLE questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  module          module_enum NOT NULL,
  category        VARCHAR(100),            -- 'la_liga', 'world_cup', 'champions_league' vb.
  difficulty      difficulty_enum NOT NULL,
  base_points     INTEGER NOT NULL DEFAULT 100,
  time_limit      INTEGER NOT NULL DEFAULT 60,  -- saniye, admin belirler
  answer_count    INTEGER NOT NULL,
  status          question_status_enum DEFAULT 'draft',
  scheduled_date  DATE,                    -- NULL ise yayınlandığı an aktif
  last_shown_at   DATE,                    -- cooldown hesabı için
  is_special      BOOLEAN DEFAULT false,   -- özel etkinlik sorusu mu?
  special_event_id UUID REFERENCES special_events(id),
  created_by      UUID REFERENCES admin_users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.4 `question_answers` — Soru Cevapları

```sql
CREATE TABLE question_answers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   UUID REFERENCES questions(id) ON DELETE CASCADE,
  entity_id     UUID REFERENCES entities(id),
  rank          INTEGER NOT NULL,          -- 1=en kolay, N=en zor, en fazla puan
  stat_value    INTEGER,                   -- ana sayısal değer (sıralama için)
  stat_display  VARCHAR(100),              -- sonuç ekranı metni: "192 asist" veya "23 şampiyonluk (1908-2021)"
  UNIQUE(question_id, rank),
  UNIQUE(question_id, entity_id)
);
```

**Önemli:** `rank` alanında 1 = en kolay cevap (az puan), N = en zor cevap (çok puan).

### 5.5 `users` — Kullanıcılar

```sql
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname          VARCHAR(20) UNIQUE NOT NULL,
  email             VARCHAR(255) UNIQUE,
  auth_provider     VARCHAR(20) NOT NULL,  -- 'google' | 'apple' | 'email'
  auth_provider_id  VARCHAR(255),
  country_code      CHAR(2) NOT NULL DEFAULT 'XX',
  avatar_index      SMALLINT DEFAULT 0,    -- hazır avatar listesinden seçim
  referral_code     VARCHAR(10) UNIQUE NOT NULL,  -- kayıtta otomatik üretilir
  referred_by_code  VARCHAR(10),           -- nullable, kayıtta girilen kod
  timezone          VARCHAR(50) DEFAULT 'Europe/Istanbul',
  subscription_tier VARCHAR(10) DEFAULT 'free',  -- 'free' | 'premium'
  premium_expires_at TIMESTAMPTZ,
  is_banned         BOOLEAN DEFAULT false,
  ban_reason        TEXT,
  last_active_at    TIMESTAMPTZ DEFAULT NOW(),
  nickname_changed_at TIMESTAMPTZ,         -- son nickname değişim tarihi
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.6 `game_sessions` — Oyun Oturumları

```sql
CREATE TABLE game_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id       UUID REFERENCES questions(id),
  started_at        TIMESTAMPTZ NOT NULL,  -- server timestamp, hile tespiti
  submitted_at      TIMESTAMPTZ,           -- NULL ise henüz bitmedi
  submitted_answers UUID[],               -- kullanıcının girdiği entity_id'leri
  correct_ranks     INTEGER[],            -- doğru bildiği rank'lar: [3, 5, 7]
  wrong_entity_ids  UUID[],              -- yanlış girilen entity_id'ler
  all_slots_filled  BOOLEAN DEFAULT false, -- süre bonusu için koşul
  score_base        INTEGER DEFAULT 0,    -- ham pozisyon puanı
  score_time_bonus  INTEGER DEFAULT 0,    -- süre bonusu
  score_difficulty  INTEGER DEFAULT 0,    -- zorluk çarpanı sonrası
  score_final       INTEGER DEFAULT 0,    -- reklam dahil final (leaderboard'a giden)
  ad_multiplied     BOOLEAN DEFAULT false,
  flag_suspicious   BOOLEAN DEFAULT false,
  suspicious_reason TEXT,
  cooldown_until    DATE,                 -- bu soru tekrar ne zaman gösterilebilir
  UNIQUE(user_id, question_id)
);
```

### 5.7 `point_history` — Puan Geçmişi

```sql
CREATE TABLE point_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id  UUID REFERENCES game_sessions(id),
  module      module_enum NOT NULL,
  is_special  BOOLEAN DEFAULT false,
  points      INTEGER NOT NULL,           -- 0 puanlı kayıt YAZILMAZ
  earned_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.8 `leaderboard_snapshots` — Leaderboard Arşivi

```sql
CREATE TABLE leaderboard_snapshots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_label VARCHAR(20) NOT NULL,      -- '2025-Q1', '2025-Q2'
  scope        VARCHAR(10) NOT NULL,      -- 'global' | 'tr'
  module       module_enum,               -- NULL ise genel sıralama
  rankings     JSONB NOT NULL,            -- [{rank, user_id, nickname, score}]
  snapshot_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.9 `admin_users` — Admin Kullanıcıları

```sql
CREATE TABLE admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL,     -- 'super_admin' | 'editor' | 'moderator'
  created_by    UUID REFERENCES admin_users(id),
  is_active     BOOLEAN DEFAULT true,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.10 `special_events` — Özel Etkinlikler

```sql
CREATE TABLE special_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,      -- 'Dünya Kupası 2026'
  icon        VARCHAR(10),               -- '🌍'
  color_hex   VARCHAR(7),               -- '#D4AF37'
  starts_at   DATE NOT NULL,
  ends_at     DATE NOT NULL,
  is_active   BOOLEAN DEFAULT false,
  created_by  UUID REFERENCES admin_users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

**Kural:** Aynı anda yalnızca 1 özel etkinlik `is_active = true` olabilir. Backend bunu zorunlu kılar.

### 5.11 `daily_question_assignments` — Günlük Soru Atamaları

```sql
CREATE TABLE daily_question_assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_date DATE NOT NULL,
  module       module_enum NOT NULL,
  question_id  UUID REFERENCES questions(id),
  is_extra     BOOLEAN DEFAULT false,    -- reklam ekstrasında gelen sorular için de kayıt
  UNIQUE(assigned_date, module, is_extra)
);
```

---

## 6. PUANLAMA ALGORİTMASI (KESİN FORMÜL)

### 6.1 Pozisyon Ağırlığı

Rank 1 = en kolay = en az puan. Rank N = en zor = en fazla puan. ~2x fark.

```
offset = N × 0.8
weight(rank) = rank + offset
total_weight = Σ weight(1..N)
normalized(rank) = weight(rank) / total_weight
position_score(rank) = normalized(rank) × base_points
```

**10 cevaplı, base_points=100 örnek:**

| Rank | Puan |
|---|---|
| 1 (kolay) | 8.2 |
| 5 | 11.4 |
| 10 (zor) | 16.4 |

### 6.2 Tam Hesaplama Sırası

```
ADIM 1 — Ham puan:
  score_base = Σ position_score(rank_i)  [sadece doğru bilinen rank'lar]

ADIM 2 — Süre bonusu (yalnızca tüm slotlar doluysa):
  score_time_bonus = floor((remaining_seconds / time_limit) × 25)
  [Maksimum 25 puan]

ADIM 3 — Zorluk çarpanı:
  difficulty_multiplier = easy:1.0 | medium:1.25 | hard:1.5
  score_difficulty = floor((score_base + score_time_bonus) × difficulty_multiplier)

ADIM 4 — Reklam çarpanı (kullanıcı reklam izlediyse):
  score_final = floor(score_difficulty × 1.5)
  [İzlemediyse score_final = score_difficulty]

ADIM 5 — Leaderboard'a yaz:
  ZADD leaderboard:<scope>:<period> score_final user_id
```

### 6.3 Süre Bonusu Koşulu

Süre bonusu yalnızca şu koşulda verilir: `all_slots_filled = true`
Yani kullanıcı tüm cevap slotlarını doldurmuş olmalı (doğru veya yanlış fark etmez) ve "Bitir" butonuna basmış olmalı. Süre dolarak biten oyunda süre bonusu verilmez.

### 6.4 Eşit Puan Durumu

Leaderboard'da iki kullanıcı aynı puana sahipse **nickname'e göre alfabetik sıra** uygulanır.

---

## 7. GÜNLÜK LİMİT SİSTEMİ

### 7.1 Free Kullanıcı

| Kaynak | Günlük Hak |
|---|---|
| Normal modüller (players, clubs, nationals, managers) | Her modülden 1 = **4 soru** |
| Özel etkinlik | **1 soru** (aktif etkinlik varsa) |
| Reklam ekstrası | Her modülden 1 ekstra = **4 soru** (günde max 4 reklam) |
| **Günlük maksimum** | **9 soru** |

### 7.2 Premium Kullanıcı

| Kaynak | Günlük Hak |
|---|---|
| Normal modüller | Her modülden 2 = **8 soru** |
| Özel etkinlik | **1 soru** |
| Reklam çarpımı | Otomatik × 1.5, **günde 4 soru için** (normal modül hakkı kadar) |
| **Günlük maksimum** | **9 soru** |

### 7.3 Reklam Ekstrasında Soru Seçimi

- Reklam izlendiğinde ilgili modülün soru havuzundan **random** yeni soru gelir.
- Bu soru o günün normal sorusundan farklıdır.
- 90 günlük cooldown kuralı reklam soruları için de geçerlidir.

### 7.4 Sıfırlama

- Her gün **UTC+3 00:00'da** günlük sayaçlar sıfırlanır.
- `daily_limit_reset` cron işi bu sıfırlamayı yapar.
- `users.timezone` şimdiden DB'de tutulur, MVP'de sabit `Europe/Istanbul`.

---

## 8. 90 GÜNLÜK COOLDOWN KURALLARI

- Cooldown **"Başla" butonuna basıldığında** başlar.
- Kullanıcı soruyu açıp çözmeden çıkarsa cooldown yine başlar.
- Kullanıcı hiç cevap girmeden süre dolarsa: 0 puan, çözüldü sayılır, cooldown başlar.
- **En az 1 cevap girildiyse:** Girilen cevaplar değerlendirilir, puan verilir.
- 0 puanlı oturumlar `game_sessions`'a yazılır ama `point_history`'ye yazılmaz.
- `cooldown_until = current_date + 90`

---

## 9. LEADERBOARD SİSTEMİ

### 9.1 Redis Key Yapısı

```
leaderboard:global:alltime
leaderboard:global:weekly:<ISO-hafta>      -- örn: 2025-W24
leaderboard:global:monthly:<yıl-ay>       -- örn: 2025-06
leaderboard:global:quarterly:<yıl-Q>      -- örn: 2025-Q2
leaderboard:tr:alltime
leaderboard:tr:weekly:<ISO-hafta>
leaderboard:tr:monthly:<yıl-ay>
leaderboard:tr:quarterly:<yıl-Q>
leaderboard:module:players:global:alltime
leaderboard:module:clubs:tr:alltime
leaderboard:special:<event_id>:global
-- ... vb. modül × scope kombinasyonları
```

Her key bağımsızdır. Aylık sıfırlama haftalığı etkilemez.

### 9.2 Güncelleme

Gerçek zamanlı: Her oturum sonunda puan Redis'e anında yazılır.
`ZADD leaderboard:global:alltime <score_final> <user_id>`

### 9.3 Sıralama Sorgusu

```
ZREVRANK leaderboard:global:alltime <user_id>   → kullanıcı sırası (0-indexed, +1 ekle)
ZREVRANGE leaderboard:global:alltime 0 99 WITHSCORES → top 100
ZCARD leaderboard:global:alltime → toplam katılımcı
```

### 9.4 Dönemsel Sıfırlama ve Arşiv

- **Haftalık:** Her Pazartesi UTC+3 00:01 → `leaderboard_archiver` haftalık key'i PostgreSQL'e yazar, Redis'ten siler.
- **Aylık:** Her ayın 1'i UTC+3 00:01 → aynı işlem aylık key için.
- **3 Aylık:** Ocak, Nisan, Temmuz, Ekim 1'inde → aynı işlem quarterly key için. `leaderboard_snapshots` tablosuna yazılır. Kullanıcı profilinde "Geçmiş dönem sıralamalarım" olarak görünür.

### 9.5 Kullanıcı Silme

Hesap silindiğinde: `ZREM leaderboard:* <user_id>` tüm Redis key'lerinden kaldırır.

---

## 10. BLUR VE PREMİUM SİSTEMİ

### 10.1 Blur Kuralı

Sonuç ekranında:
- Doğru bilinen cevaplar: Görünür (yeşil).
- Yanlış girilen cevaplar: Görünür (kırmızı), yanında sadece "Bu listede değil" — sıra ipucu verilmez.
- Hiç girilmemiş doğru cevaplar: **Blur** (frosted glass). Sadece sıra numarası görünür.

**Blur server-side'dır.** Premium olmayan kullanıcıya API blur'lu cevapların içeriğini göndermez.

`GET /sessions/:id/result` davranışı:
- `subscription_tier = 'free'` → `correct_answers` sadece kullanıcının doğru bildiği satırları döner. Diğer satırlar `{ rank: N, blurred: true }` olarak döner.
- `subscription_tier = 'premium'` → tüm satırlar görünür döner.

Her oturum bağımsız snapshot'tır. Kullanıcı aynı soruyu 90 gün sonra tekrar çözerse eski blur kaldırılmaz; yeni oturum bağımsız değerlendirilir.

### 10.2 Premium Paket

| Özellik | Free | Premium |
|---|---|---|
| Günlük normal soru | Her modülden 1 | Her modülden 2 |
| Blur | Blur'lu | Açık |
| Reklam | Var | Yok |
| ×1.5 çarpım | Reklam izleyerek (4 hak) | Otomatik (4 hak) |

**Abonelik:** Aylık ve yıllık seçenek. TL fiyatlandırma. Ücretsiz deneme yok (MVP'de).
**Teknik:** App Store `auto-renewable subscription`. `users.subscription_tier` ve `users.premium_expires_at` backend tarafından doğrulanır.

---

## 11. OYUN AKIŞI (ADIM ADIM)

```
1. Ana ekranda modül kartına tıkla (players / clubs / nationals / managers)
2. "Günün Challenge" detay ekranı açılır:
      → Zorluk rozeti, süre kısıtı, cevap sayısı gösterilir
      → Soru başlığı GÖSTERILMEZ (hile önleme)
3. "Başla" butonuna bas
      → server: game_session oluştur, started_at = NOW()
      → cooldown_until = NOW() + 90 gün (hemen işaretle)
      → client: sayaç başlar, soru başlığı gösterilir
4. Kullanıcı arama kutusuna 2+ harf yazar
      → debounce 300ms, autocomplete endpoint'i çağrılır
      → Sadece ilgili entity_type filtrelenir
      → Maks. 6 sonuç gösterilir
      → Zaten seçilenler listeden çıkar
5. Entity seçilir → slota eklenir
6. Koşullar sağlandığında "Bitir" butonu aktif olur:
      → En az 1 cevap girilmiş OLMALI
      → Kullanıcı istediği zaman bitirabilir (slotlar dolmak zorunda değil)
      → Ama süre bonusu için TÜM slotlar dolmalı
7. "Bitir" basılır veya süre dolar
      → server: submitted_at = NOW()
      → Hile kontrolü: (submitted_at - started_at) < answer_count × 4s → flag
      → Puanlama algoritması çalışır (Bölüm 6)
      → score_final > 0 ise point_history'ye yaz
      → Redis leaderboard güncelle
8. Sonuç ekranı açılır:
      → Puan sayma animasyonu
      → Sıralama bilgisi async/lazy yüklenir (1-2 sn sonra)
      → Doğru/yanlış gösterimi + blur
      → Reklam butonu: isAdLoaded kontrolü; reklam yoksa "Reklam Yok" pasif gösterilir
9. Kullanıcı reklam izlerse:
      → score_final = floor(score_difficulty × 1.5) olarak güncellenir
      → Redis ve point_history güncellenir
      → ad_multiplied = true
      → Günlük reklam sayacı 1 artırılır
```

---

## 12. AUTOCOMPLETE SİSTEMİ

### 12.1 İstek Akışı

```
Client → debounce 300ms → GET /search?q=mes&type=player
Backend → Redis cache kontrol et
  HIT  → döndür
  MISS → PostgreSQL FTS sorgula → Redis'e yaz (TTL 24 saat) → döndür
```

### 12.2 Redis Cache Key

```
autocomplete:<type>:<ilk_3_harf>
autocomplete:player:mes → ["Messi Lionel", "Mesut Özil", ...]
autocomplete:club:bar   → ["Barcelona", "Barnsley", ...]
```

Admin yeni entity eklediğinde ilgili prefix invalidate edilir:
`DEL autocomplete:<type>:*`

### 12.3 PostgreSQL FTS Sorgusu

```sql
SELECT id, name, country_code, image_path
FROM entities
WHERE entity_type = $1
  AND is_active = true
  AND to_tsvector('simple', name || ' ' || array_to_string(aliases, ' '))
      @@ plainto_tsquery('simple', $2)
ORDER BY ts_rank(...) DESC
LIMIT 6;
```

Türkçe karakter normalizasyonu (İ→i, Ş→ş vb.) sorgu öncesi uygulanır.

---

## 13. CRON İŞLERİ

| İş Adı | Zamanlama (UTC+3) | Görev |
|---|---|---|
| `daily_limit_reset` | Her gün 00:00 | Kullanıcı günlük soru ve reklam sayaçlarını sıfırla |
| `daily_question_selector` | Her gün 00:05 | Her modül için havuzdan random soru seç, `daily_question_assignments`'a yaz |
| `cooldown_cleanup` | Her gün 01:00 | 90 günü dolan soruları havuza geri al (last_shown_at kontrolü) |
| `suspicious_flag_report` | Her gün 08:00 | Önceki günün flaglı oturumlarını admin dashboard'una raporla |
| `leaderboard_archiver` | Pazartesi 00:01 (haftalık), Ayın 1'i 00:01 (aylık), Oc/Nis/Tem/Eki 1'i 00:01 (3 aylık) | Redis snapshot'ı PostgreSQL'e yaz, Redis key'ini sil |
| `pool_health_check` | Her gün 09:00 | Her modülde kaç aktif soru kaldığını hesapla, eşik altındaysa admin uyarısı oluştur |

**Havuz boşalma eşiği:** Bir modülde 7'den az soru kaldığında admin dashboard'unda kırmızı uyarı gösterilir.

---

## 14. API ENDPOINT LİSTESİ

### 14.1 Auth

```
POST   /api/v1/auth/google          Google OAuth token → JWT
POST   /api/v1/auth/apple           Apple OAuth token → JWT
POST   /api/v1/auth/email/register  Email + şifre kayıt
POST   /api/v1/auth/email/login     Email + şifre giriş
POST   /api/v1/auth/refresh         Refresh token → yeni access token
DELETE /api/v1/auth/logout          Refresh token iptal
```

### 14.2 Kullanıcı

```
GET    /api/v1/users/me                     Profil bilgileri
PATCH  /api/v1/users/me                     Nickname, avatar, ülke güncelle
DELETE /api/v1/users/me                     Hesap silme
GET    /api/v1/users/check-nickname/:nick   Nickname müsaitlik kontrolü
GET    /api/v1/users/me/history             Geçmiş dönem sıralama snapshot'ları
```

### 14.3 Sorular

```
GET    /api/v1/questions/daily              Bugünkü modül atamaları (başlık YOK, sadece meta)
GET    /api/v1/questions/:id/meta           Zorluk, süre, cevap sayısı (başlık YOK)
POST   /api/v1/questions/:id/start          Oturum başlat → game_session_id döner
```

### 14.4 Oyun Oturumu

```
POST   /api/v1/sessions/:id/submit          Cevapları gönder, puanlama yap
GET    /api/v1/sessions/:id/result          Sonuç (blur kuralı uygulanır)
POST   /api/v1/sessions/:id/ad-reward       Reklam izlendi → ×1.5 uygula
```

### 14.5 Arama

```
GET    /api/v1/search?q=&type=              Autocomplete (rate limit: 20 istek/dk/kullanıcı)
```

### 14.6 Leaderboard

```
GET    /api/v1/leaderboard?scope=&period=&module=&limit=   Top N listesi
GET    /api/v1/leaderboard/me?scope=&period=&module=       Kullanıcının kendi sırası
```

### 14.7 Uygulama Konfigürasyonu

```
GET    /api/v1/app/config       minimum_version, latest_version, force_update, active_event
```

### 14.8 Admin API (JWT + admin role — ayrı prefix)

```
-- Entity
GET    /api/admin/entities
POST   /api/admin/entities
PATCH  /api/admin/entities/:id
DELETE /api/admin/entities/:id

-- Soru
GET    /api/admin/questions
POST   /api/admin/questions
PATCH  /api/admin/questions/:id
POST   /api/admin/questions/:id/archive     Soft arşiv (archiving → archived)
GET    /api/admin/questions/pool-health     Modül başına aktif soru sayısı

-- Özel Etkinlik
GET    /api/admin/events
POST   /api/admin/events
PATCH  /api/admin/events/:id
POST   /api/admin/events/:id/activate       Diğer aktif etkinlikleri kapatır

-- Kullanıcı
GET    /api/admin/users                     Filtreli liste
GET    /api/admin/users/:id
POST   /api/admin/users/:id/ban
POST   /api/admin/users/:id/unban
GET    /api/admin/users/flagged             Şüpheli oturumu olan kullanıcılar

-- İstatistik
GET    /api/admin/stats/dashboard           Tüm dashboard metrikleri

-- Admin Kullanıcı Yönetimi (sadece super_admin)
GET    /api/admin/admins
POST   /api/admin/admins
PATCH  /api/admin/admins/:id
DELETE /api/admin/admins/:id
```

---

## 15. GÜVENLİK MİMARİSİ

### 15.1 JWT

- Access token: 15 dakika, `Authorization: Bearer <token>` header'ında
- Refresh token: 30 gün, `flutter_secure_storage`'da (cihazda şifreli)
- Refresh token rotasyonu: Her yenilemede yeni token üretilir, eskisi geçersizleşir

### 15.2 Rate Limiting

| Endpoint | Limit |
|---|---|
| `/auth/*` | 10 istek / 15 dakika / IP |
| `/search` | 20 istek / dakika / kullanıcı |
| `/sessions/*/submit` | 30 istek / saat / kullanıcı |
| Admin giriş | 5 istek / 15 dakika / IP |

### 15.3 Hile Tespiti

- `submitted_at - started_at < answer_count × 4 saniye` → `flag_suspicious = true`, `suspicious_reason` doldurulur
- Puanlama yine yapılır, flag sadece admin incelemesi içindir
- Admin flaglı oturumu görüp manuel ban kararı verir
- Moderatör ban önerir → super_admin dashboard'dan pending listede görür, onaylar veya reddeder

### 15.4 Admin Panel Güvenliği

- Admin panel ayrı auth sistemi kullanır (email + bcrypt hash, JWT yok — session cookie)
- RBAC rolleri: `super_admin` > `editor` > `moderator`
- `super_admin` tüm işlemleri yapabilir
- `editor`: entity ve soru CRUD, yayınlama
- `moderator`: kullanıcı görüntüleme, ban önerisi

### 15.5 Genel

- Tüm API HTTPS üzerinden çalışır
- Input validation her endpoint'te Zod ile yapılır
- SQL injection: Prisma parametreli sorgu kullanır
- Puan hesabı: Yalnızca sunucuda. Client'tan gelen puan değeri asla kabul edilmez.

---

## 16. HATA YÖNETİMİ VE HATA KODLARI

### 16.1 API Hata Formatı

```json
{
  "error": {
    "code": "SESSION_ALREADY_EXISTS",
    "message": "Bu soruyu zaten çözdünüz.",
    "details": {}
  }
}
```

### 16.2 Hata Kodları

| HTTP | Kod | Açıklama |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Gelen veri Zod şemasını geçemedi |
| 401 | `UNAUTHORIZED` | Token yok veya geçersiz |
| 401 | `TOKEN_EXPIRED` | Access token süresi doldu |
| 403 | `FORBIDDEN` | Rol yetersiz |
| 403 | `ACCOUNT_BANNED` | Kullanıcı banlandı |
| 404 | `NOT_FOUND` | Kaynak bulunamadı |
| 409 | `NICKNAME_TAKEN` | Nickname zaten alınmış |
| 409 | `SESSION_ALREADY_EXISTS` | Aynı soruyu iki kez çözmeye çalışıldı |
| 409 | `DAILY_LIMIT_REACHED` | Günlük soru limiti doldu |
| 409 | `AD_ALREADY_USED` | Bu oturum için reklam bonusu zaten kullanıldı |
| 409 | `EVENT_ALREADY_ACTIVE` | Aynı anda ikinci etkinlik aktif edilemez |
| 422 | `QUESTION_ARCHIVING` | Soru arşivleme sürecinde, başlanamaz |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate limit aşıldı |
| 500 | `INTERNAL_ERROR` | Sunucu hatası |

### 16.3 Flutter Hata Yönetimi

- `DioException` → `ApiError` modeline map edilir
- `TOKEN_EXPIRED` → otomatik refresh denenır; başarısızsa login ekranına yönlendirilir
- `DAILY_LIMIT_REACHED` → kullanıcıya net mesaj + reklam izle butonu gösterilir
- `ACCOUNT_BANNED` → "Hesabınız askıya alındı" ekranı, başka işlem yapılamaz

---

## 17. KULLANICI KAYIT VE GİRİŞ AKIŞI

```
1. Giriş Ekranı
   → "Google ile Giriş" / "Apple ile Giriş" / "E-posta ile Giriş"
   → Apple giriş iOS'ta ZORUNLU (App Store kuralı)

2. OAuth tamamlanır → backend JWT üretir

3. YENİ KULLANICI → Nickname Seçimi Ekranı
   → Min 3, maks 20 karakter. Sadece harf, rakam, alt çizgi.
   → Her tuş vuruşunda debounce ile /check-nickname çağrısı
   → Alınmışsa: "Bu nickname zaten kullanılıyor" (kırmızı, anlık)

4. YENİ KULLANICI → Ülke Seçimi (opsiyonel, varsayılan: telefon diline göre)
   → Dropdown. "XX" = bilinmiyor → Global sıralamaya dahil, TR sıralamaya dahil değil

5. YENİ KULLANICI → Avatar Seçimi (20-30 hazır futbol temalı avatar)

6. "Seni kim davet etti?" alanı (opsiyonel)
   → Girilen kod `referred_by_code` olarak kaydedilir, ödül yok, sadece analitik

7. Ana ekrana yönlendirilir
```

**ESKİ KULLANICI:** OAuth tamamlanır → JWT → doğrudan ana ekran.

---

## 18. ADMIN PANELİ — TAM İŞ AKIŞLARI

### 18.1 Soru Oluşturma Akışı

```
1. Modül seç (players / clubs / nationals / managers / özel etkinlik)
2. Başlık gir
3. Kategori seç veya yeni kategori gir (la_liga, world_cup vb.)
4. Zorluk seç (easy / medium / hard)
5. Süre gir (saniye, admin belirler)
6. Base points gir (varsayılan 100)
7. Cevapları gir (sürükle-bırak, rank sırasıyla):
   → Entity arama (autocomplete DB'den)
   → "Yeni Entity Hızlı Ekle" inline modal butonu var
   → Her cevap için stat_value (sayısal) ve stat_display (metin) gir
   → Aynı entity iki kez eklenemez (soru bazında kontrol, anlık hata mesajı)
8. Yayın seçeneği:
   → "Hemen Yayınla" → status = active, scheduled_date = NULL
   → "Tarihe Programla" → scheduled_date seç, cron günlük havuza alır
9. "Taslak Kaydet" veya "Yayınla"
```

### 18.2 Soru Arşivleme

```
Admin "Arşivle" tıklar
→ Aktif oturum var mı? (started_at var ama submitted_at NULL olan session)
  EVET → status = 'archiving'. 10 dakika sonra cron 'archived' yapar.
  HAYIR → status = 'archived'. Anlık.
→ Arşivlenen soruların önceki puanları DEĞİŞMEZ.
```

### 18.3 Dashboard Metrikleri

- **Kullanıcı:** DAU (son 7 günde en az 1 giriş), MAU, toplam kayıtlı, yeni kayıt (bugün/bu hafta/bu ay), churn oranı, ülke dağılımı, subscription_tier dağılımı
- **Soru:** En yüksek/düşük doğru oranı, en çok çözülen, abandon rate (başladı ama bitirmedi), ortalama tamamlanma süresi
- **Puan:** Günlük dağıtılan toplam puan, reklam çarpımı kullanım oranı, soru başına ortalama puan
- **Modül:** Her modülün günlük aktif kullanıcısı, modül bazında çözüm sayısı
- **Havuz Sağlığı:** Her modülde kaç aktif soru var, tahmini kaç günde boşalır
- **Teknik:** Flaglı oturum sayısı (bugün), API hata sayısı (son 24 saat)

### 18.4 Kullanıcı Yönetimi

**Arama/Filtreleme:**
- Nickname ile
- E-posta ile
- Filtre: en yüksek puanlılar, en yeni kayıtlar, flaglı oturumu olanlar
- Ülke filtresi

**Ban İşlemi:**
- `editor` ve `moderator` ban yapamaz
- `moderator` "ban öner" → super_admin dashboard'unda "Bekleyen Ban Önerileri" listesinde görünür
- `super_admin` onaylar veya reddeder (kayıt logda kalır)
- Ban edilmiş kullanıcı giriş yapmaya çalışırsa: "Hesabınız askıya alındı" ekranı. Başka bilgi verilmez.
- Aynı e-posta ile tekrar kayıt olamaz. Farklı e-posta ile olabilir.

### 18.5 Özel Etkinlik Yönetimi

- Aynı anda yalnızca 1 etkinlik aktif olabilir
- "Aktif Et" tıklanırsa mevcut aktif etkinlik otomatik kapatılır
- Etkinlik sona erdiğinde sorular arşivlenir
- Biten etkinlik leaderboard'ları kullanıcı profilinde gösterilmez

---

## 19. FORCE UPDATE MEKANİZMASI

```
Uygulama açılışında:
GET /api/v1/app/config
→ {
    "minimum_version": "1.2.0",
    "latest_version": "1.5.0",
    "force_update": false,
    "active_event": { "id": "...", "name": "WC 2026", "icon": "🌍" }
  }

Eğer app_version < minimum_version:
  → "Lütfen Güncelleyin" ekranı gösterilir, arka plan işlemleri durur.
  → Kullanıcı App Store / Play Store'a yönlendirilir.
```

`app_config` tablosu admin panelden düzenlenir.

---

## 20. GELİŞTİRME AŞAMALARI (FAZLAR)

### ⚠️ TEMEL İLKE
**Sağlam altyapı ve backend tamamlanmadan kesinlikle Flutter geliştirmesine geçilmez.**
Her faz kendi test süitini içerir. Bir fazın testleri geçmeden sonraki faz başlamaz.

---

### FAZ 0 — Proje Kurulumu (1 hafta)

- [ ] Monorepo yapısını oluştur
- [ ] Supabase projesi: PostgreSQL şemasını Prisma migration ile kur
- [ ] Tüm tabloları ve enum'ları oluştur
- [ ] Redis (Upstash) bağlantısını test et
- [ ] Backend projesini başlat (Express + TypeScript + Prisma)
- [ ] Admin React projesini başlat
- [ ] Flutter projesini başlat (feature-based klasör yapısı)
- [ ] Ortam değişkenleri (`.env.example`) belgele
- [ ] İlk `app_config` kaydını DB'ye ekle

**Faz 0 Test Kriterleri:**
- Prisma migration hatasız çalışıyor
- Redis'e yazıp okuma başarılı
- Her proje bağımsız derlenebiliyor

---

### FAZ 1 — Backend Core 

- [ ] JWT auth sistemi: Google + Apple OAuth (Supabase Auth entegrasyonu)
- [ ] Email kayıt/giriş
- [ ] Refresh token rotasyonu
- [ ] Nickname müsaitlik endpoint'i
- [ ] Rate limiting middleware
- [ ] Entity CRUD (admin)
- [ ] Autocomplete endpoint + PostgreSQL FTS + Redis cache
- [ ] Soru CRUD (admin) — cevap ekleme, rank kontrolü
- [ ] Cron job altyapısı (`node-cron`)
- [ ] `daily_question_selector` cron
- [ ] `daily_limit_reset` cron
- [ ] Puanlama motoru (Bölüm 6 formülünü ayrı servis olarak yaz)
- [ ] Oyun oturumu API'leri: start / submit / result
- [ ] Blur mantığı: premium kontrolü server-side
- [ ] Reklam ödülü endpoint'i
- [ ] Hile tespit middleware'i
- [ ] Leaderboard Redis işlemleri
- [ ] Leaderboard sorgu endpoint'leri

**Faz 1 Test Kriterleri (Jest + Supertest):**
- Auth akışı uçtan uca test (kayıt → giriş → token yenileme → çıkış)
- Puanlama motoru birim testleri: 5 farklı senaryo (0 doğru, yarısı doğru, hepsi doğru, süre bonusu, reklam)
- Hile tespiti birim testi: eşik altı süre → flag atılıyor mu?
- Rate limiting testi: limit aşımında 429 dönüyor mu?
- Blur testi: free kullanıcıya blur'lu veri gitmiyor mu?
- Oturum tekrar engeli: aynı soruda ikinci oturum 409 veriyor mu?
- Leaderboard yazma/okuma/sıralama testi

---

### FAZ 2 — Admin Paneli 

- [ ] Admin giriş ekranı (session cookie)
- [ ] RBAC middleware
- [ ] Entity yönetimi: liste, arama, ekleme, düzenleme, çift kayıt uyarısı
- [ ] Soru oluşturma: sürükle-bırak cevap listesi, inline entity modal
- [ ] Soru listesi ve filtreleme
- [ ] Soru arşivleme (soft arşiv)
- [ ] Özel etkinlik yönetimi
- [ ] Kullanıcı yönetimi: arama, filtreleme, ban akışı
- [ ] Dashboard: tüm metrikler
- [ ] Havuz sağlığı uyarı widget'ı
- [ ] Bekleyen ban önerileri listesi (super_admin)
- [ ] app_config düzenleme ekranı (force update, minimum version)

**Faz 2 Test Kriterleri:**
- RBAC: editor soru oluşturabilir, kullanıcı ban edemez
- moderator ban önerisi → super_admin listede görüyor
- Aynı entity iki kez eklenince hata veriyor
- Soru havuzu eşik altına düşünce uyarı görünüyor

---

### FAZ 3 — Flutter Mobil 

**Bu faza geçmeden önce Faz 1 ve Faz 2 testleri %100 geçmiş olmalıdır.**

- [ ] Splash + Onboarding (3 sayfa)
- [ ] Auth ekranı (Google / Apple / Email)
- [ ] Nickname + Ülke + Avatar seçimi
- [ ] Referral kodu girişi
- [ ] Ana ekran: modül kartları, günlük hak durumu
- [ ] Modül detay ekranı (zorluk, süre, cevap sayısı — başlık yok)
- [ ] Oyun ekranı: sayaç, autocomplete, slot yönetimi, "Bitir" butonu
- [ ] Sonuç ekranı: puan animasyonu, blur, yanlış gösterimi, reklam butonu, lazy sıralama
- [ ] Leaderboard ekranı: sekmeler (global/TR, haftalık/aylık/3aylık/tüm zamanlar), modül filtreleri
- [ ] Profil ekranı: istatistikler, tüm sıralamalar, geçmiş dönemler, rozetler
- [ ] Ayarlar: nickname değiştir (opsiyonel), ülke değiştir, hesap sil, çıkış
- [ ] Force update ekranı
- [ ] Ban ekranı
- [ ] Hata ekranları (ağ yok, sunucu hatası)

**Faz 3 Test Kriterleri (Widget + Integration):**
- Autocomplete 2 harf sonrası tetikleniyor
- Slot sayısı cevap_sayısını aşamıyor
- Tüm slotlar dolunca "Bitir" aktif, süre bonusu alanı hesaplanıyor
- Sıfır cevapla süre dolarsa 0 puan, cooldown başlıyor
- Reklam butonu adYüklenmediyse pasif görünüyor
- Premium kullanıcıda blur yok
- Force update: minimum versiyon altındaysa uygulama kilitleniyor

---

### FAZ 4 — İçerik ve Lansman Hazırlığı 

- [ ] En az 120 soru gir (her modülden 30+)
- [ ] WC 2026 için en az 20 özel etkinlik sorusu hazır
- [ ] Gerçek cihazda (iOS + Android) uçtan uca test
- [ ] App Store screenshot'ları (6.7", 6.5", 5.5" ekranlar)
- [ ] Privacy Policy ve Terms of Service sayfaları (zorunlu, URL olarak App Store'a verilecek)
- [ ] AdMob uygulama kaydı ve test reklamları
- [ ] Load testi: 1000 eş zamanlı kullanıcı simülasyonu
- [ ] App Store başvurusu (en geç Mayıs 2026 başı)
- [ ] Play Store başvurusu
- [ ] Soft launch

---

## 21. TEMEL GELİŞTİRME İLKELERİ

1. **Önce test, sonra feature.** Her endpoint yazılır yazılmaz test süiti yazılır.
2. **İş mantığı backend'de.** Flutter sadece gösterir, asla hesaplamaz.
3. **Sıfır magic number.** Tüm sabitler (90 gün, 4 saniye/cevap, 25 max süre bonusu vb.) `constants/` dosyasında tanımlanır.
4. **Her cron idempotent.** Aynı cron iki kez çalışırsa ikinci çalışma bozukluk yaratmamalıdır.
5. **Prisma migration'ları commit'lenir.** DB şeması asla doğrudan SQL ile değiştirilmez.
6. **`.env` asla commit'lenmez.** `.env.example` her zaman güncel tutulur.
7. **API versiyonlama:** Tüm endpoint'ler `/api/v1/` prefix'i ile başlar.
8. **Loglama:** Her 5xx hatası structured log olarak yazılır (timestamp, endpoint, error, user_id).
9. **Önce mobil tasarım (mobile-first).** Admin paneli masaüstü öncelikli ama mobil kırılmaları kontrol edilir.
10. **Bu dosyaya aykırı hiçbir karar alınamaz.** Değişiklik gerekiyorsa önce bu dosya güncellenir, sonra kod yazılır.

---

## 22. ÖNEMLİ SINIR KURALLAR 

### Kesinlikle YAPILMAYACAKLAR

- Client tarafından gelen puan değeri kabul edilemez
- Bir kullanıcı aynı soruyu cooldown süresi dolmadan çözemez (`UNIQUE` constraint + cooldown_until kontrolü)
- Aynı anda birden fazla özel etkinlik aktif olamaz
- Admin paneline normal kullanıcı girişi yapılamaz (ayrı auth sistemi)
- Blur'lu cevapların içeriği free kullanıcıya API'den gönderilemez
- Flutter Faz 3'e, Faz 1 ve 2 testleri tamamlanmadan geçilemez
- `editor` veya `moderator` kullanıcıyı ban edemez (ban önerebilir)
- 0 puanlı oturum `point_history`'ye yazılamaz

### Kesinlikle YAPILACAKLAR

- Her oturum başlangıcında `started_at` server timestamp kaydedilir
- Hile tespiti her submit'te otomatik çalışır
- Tüm slotlar dolup "Bitir" basılınca süre bonusu hesaplanır
- Yanlış entity gösteriminde sıra ipucu verilmez ("Bu listede değil" yeterli)
- Soru arşivlenirken aktif oturum varsa önce `archiving` bekleme süreci işletilir
- Leaderboard silme: Hesap silinince Redis'ten de kaldırılır
- Nickname değişince leaderboard anlık olarak yeni nickname ile gösterilir (user_id → nickname join)
- Autocomplete arama 2 harf sonrası başlar, her sorguda entity_type filtresi zorunludur
- `app/config` endpoint'i her uygulama açılışında sorgulanır

---

## 23. RAPORLAMA VE TAKİP KURALLARI

Gemini, projenin her anındaki durumunu ve geçmişini şeffaf tutmak için şu iki dosyayı güncel tutmakla yükümlüdür:

### 23.1 active_context.md
- Bu dosya Gemini'nin **o anki** çalışma bağlamını içerir.
- Hangi fazda olunduğu, hangi görevin yapıldığı ve bir sonraki adımın ne olduğu burada anlık olarak raporlanır.
- Her görev değişikliğinde Gemini bu dosyayı güncellemelidir.

### 23.2 progress.md
- Projenin başından itibaren yapılan tüm işlemlerin (kurulumlar, modüller, testler, hatalar ve çözümleri) kronolojik dökümüdür.
- Tamamlanan her görev için bir check-box (`[x]`) işaretlenir.
- Bu dosya projenin "karar defteri" ve "hafızası" niteliğindedir.

---

*Bu dokümantasyon tüm karar süreçlerinin yazılı çıktısıdır.*
*Burada belirtilmeyen bir konu çıkarsa Gemini karar vermeden önce kullanıcıya sorar.*
