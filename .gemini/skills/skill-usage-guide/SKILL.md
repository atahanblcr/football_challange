---
name: skill-usage-guide
description: Proje geliştirme fazlarını, skill kullanım sırasını ve prompt zincirlerini tanımlayan ana rehber.
---

# SKILL KULLANIM REHBERİ VE PROMPT ZİNCİRLERİ

> Bu dosya Gemini'nin hangi fazda hangi skill dosyasını okuyacağını,
> her görevi nasıl sıralayacağını ve tamamlama kriterlerini tanımlar.
> Gemini bu dosyayı GEMINI.md ile birlikte okur.
> Her faz başında ilgili skill'ler okunmadan kod yazılmaz.

---

## ORTAM KURULUMU — FAZ 0'DAN ÖNCE

### Supabase Kurulumu (Bir Kez Yapılır)

```
1. supabase.com → New Project oluştur
2. Proje adı: football-challenge
3. Database Password: güçlü bir şifre belirle, kaydet
4. Region: eu-central-1 (Frankfurt — Türkiye'ye en yakın)
5. Proje oluşunca:
   Project Settings → Database → Connection String → "URI" sekmesi
   → DATABASE_URL olarak kopyala

6. Project Settings → API → service_role key
   → SUPABASE_SERVICE_KEY olarak kopyala

7. Project Settings → API → URL
   → SUPABASE_URL olarak kopyala

8. Storage → New Bucket → "entity-images" → Public: true
```

### Redis Kurulumu (Geliştirme)

```bash
# Proje kök dizininde
docker compose up -d

# Bağlantıyı test et
docker exec fc_redis_dev redis-cli ping
# PONG dönmeli
```

### Upstash Kurulumu (Production Redis)

```
1. upstash.com → New Database
2. Name: football-challenge-prod
3. Region: eu-west-1
4. Oluşunca: REST URL ve REST TOKEN kopyala
   → .env.production'a yaz
```

### .env Dosyaları

```bash
# backend/.env (geliştirme)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=entity-images
STORAGE_CDN_BASE_URL=https://[PROJECT_REF].supabase.co/storage/v1/object/public/entity-images

# Geliştirmede local Redis
UPSTASH_REDIS_REST_URL=redis://localhost:6379
UPSTASH_REDIS_REST_TOKEN=

# JWT — openssl rand -base64 32 ile üret
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ADMIN_SESSION_SECRET=

NODE_ENV=development
PORT=3000
GOOGLE_CLIENT_ID=
APPLE_BUNDLE_ID=com.yourcompany.footballchallenge
```

### İlk Migration

```bash
cd backend

# Prisma client'ı üret
npx prisma generate

# Tabloları oluştur
npx prisma migrate dev --name init

# GIN index'leri ve Türkçe normalize fonksiyonunu uygula
# (20250101000001_add_custom_indexes.sql dosyasını çalıştır)
npx prisma db execute --file ./prisma/migrations/20250101000001_add_custom_indexes.sql
```

---

## SKİLL DOSYALARI REHBERİ

| Dosya | Ne Zaman Okunur |
|---|---|
| `SKILL_BACKEND_API.md` | Backend herhangi bir modül yazılmadan önce |
| `SKILL_SCORING_ENGINE.md` | Session submit ve puanlama kodlanmadan önce |
| `SKILL_REDIS_LEADERBOARD.md` | Leaderboard modülü ve cron'lar yazılmadan önce |
| `SKILL_DATABASE_PATTERNS.md` | Prisma şeması ve herhangi bir sorgu yazılmadan önce |
| `SKILL_AUTH_SYSTEM.md` | Auth modülü yazılmadan önce |
| `SKILL_CRON_JOBS.md` | Cron job'lar yazılmadan önce |
| `SKILL_ADMIN_PANEL.md` | Admin panel herhangi bir sayfası yazılmadan önce |
| `SKILL_FLUTTER_ARCHITECTURE.md` | Flutter projesine başlamadan önce (bir kez) |
| `SKILL_FLUTTER_GAME_SCREEN.md` | Game, Result ekranları yazılmadan önce |
| `SKILL_SECURITY.md` | Her faz bitiminde kontrol listesi olarak |
| `EKRANLAR.md` | Her Flutter ekranı yazılmadan önce |
| `DOSYA_AGACI.md` | Faz 0'da klasör yapısı oluşturulurken |

---

## FAZ 0 — ALTYAPI KURULUMU

### Oku
- `DOSYA_AGACI.md`
- `SKILL_DATABASE_PATTERNS.md` (Prisma şeması bölümü)
- `SKILL_BACKEND_API.md` (Proje kurulumu bölümü)

### Görevler (Bu Sırayla)

```
[ ] 1. Monorepo kök yapısını oluştur
        football-challenge/
        ├── mobile/
        ├── backend/
        ├── admin/
        ├── shared/
        ├── docker-compose.yml    ← yukarıdaki dosyayı kullan
        ├── .gitignore
        └── README.md

[ ] 2. backend/ kurulumu
        - package.json (SKILL_BACKEND_API.md'deki bağımlılıklar)
        - tsconfig.json
        - .env.example (tüm değişkenler açıklamalı)
        - prisma/schema.prisma (SKILL_DATABASE_PATTERNS.md'deki tam şema)
        - prisma/migrations/20250101000001_add_custom_indexes.sql (verilen dosya)
        - src/config/env.ts
        - src/config/database.ts
        - src/config/redis.ts
        - src/app.ts (iskelet — route'lar henüz boş)
        - src/jobs/index.ts (iskelet)

[ ] 3. admin/ kurulumu
        - package.json (SKILL_ADMIN_PANEL.md'deki bağımlılıklar)
        - vite.config.ts
        - tailwind.config.ts
        - tsconfig.json
        - index.html
        - src/main.tsx
        - src/App.tsx (iskelet)

[ ] 4. mobile/ kurulumu
        - pubspec.yaml (SKILL_FLUTTER_ARCHITECTURE.md'deki tam bağımlılıklar)
        - analysis_options.yaml
        - lib/main.dart (iskelet)
        - Klasör yapısı: lib/core/, lib/features/, lib/shared/

[ ] 5. shared/ kurulumu
        - package.json
        - src/types/ (temel tip tanımları)
        - src/constants/

[ ] 6. Doğrulama
        cd backend && npm install → hata yok
        cd admin && npm install → hata yok
        cd mobile && flutter pub get → hata yok
        docker compose up -d → redis çalışıyor
        npx prisma generate → hata yok
```

### Faz 0 Tamamlama Kriteri
Tüm kutular işaretlendi, hiçbir `npm install` / `flutter pub get` hatası yok.

---

## FAZ 1 — BACKEND CORE

### Oku (Bu Sırayla)
1. `SKILL_BACKEND_API.md` — tamamı
2. `SKILL_DATABASE_PATTERNS.md` — tamamı
3. `SKILL_AUTH_SYSTEM.md` — tamamı
4. `SKILL_SCORING_ENGINE.md` — tamamı
5. `SKILL_REDIS_LEADERBOARD.md` — tamamı
6. `SKILL_CRON_JOBS.md` — tamamı
7. `SKILL_SECURITY.md` — tamamı

### Modül Yazım Sırası ve Prompt Zincirleri

#### 1.1 — Hata Yönetimi ve Temel Yapı

```
PROMPT:
SKILL_BACKEND_API.md'yi oku.
Şu dosyaları yaz:
- src/errors/api-error.ts
- src/errors/error-codes.ts
- src/middleware/error-handler.middleware.ts
- src/utils/logger.util.ts
- src/utils/bcrypt.util.ts
- src/utils/jwt.util.ts
- src/utils/referral-code.util.ts
- src/utils/normalize-text.util.ts
- src/utils/redis-keys.util.ts (SKILL_REDIS_LEADERBOARD.md'deki tam implementasyon)

Her dosya için birim testi yaz.
Test: npm test → geçmeli.
```

#### 1.2 — Middleware Katmanı

```
PROMPT:
SKILL_BACKEND_API.md ve SKILL_SECURITY.md'yi oku.
Şu dosyaları yaz:
- src/middleware/auth.middleware.ts
- src/middleware/admin-auth.middleware.ts
- src/middleware/rbac.middleware.ts
- src/middleware/rate-limit.middleware.ts
- src/middleware/cheat-detect.middleware.ts

UYARI: Rate limit için Redis store kullan (in-memory değil).
UYARI: auth.middleware.ts ban kontrolünü içermeli.
Test: her middleware için en az 1 test.
```

#### 1.3 — Auth Modülü

```
PROMPT:
SKILL_AUTH_SYSTEM.md'yi tamamını oku.
Şu dosyaları yaz:
- src/modules/auth/auth.router.ts
- src/modules/auth/auth.controller.ts
- src/modules/auth/auth.service.ts
- src/modules/auth/auth.schema.ts

UYARI: Google token sunucu tarafında doğrulanmalı (google-auth-library).
UYARI: Refresh token rotasyonu zorunlu — eski token Redis blacklist'e alınmalı.
UYARI: Token yeniden kullanım tespiti olmalı.

Test dosyaları:
- tests/auth/google-oauth.test.ts
- tests/auth/token-refresh.test.ts (5 test senaryosu — SKILL_AUTH_SYSTEM.md'de belirtilen)

npm test → tüm testler geçmeli.
```

#### 1.4 — Kullanıcı Modülü

```
PROMPT:
SKILL_BACKEND_API.md ve SKILL_DATABASE_PATTERNS.md'yi oku.
Şu dosyaları yaz:
- src/modules/users/users.router.ts
- src/modules/users/users.controller.ts
- src/modules/users/users.service.ts
- src/modules/users/users.schema.ts

UYARI: deleteAccount fonksiyonu Redis'ten tüm leaderboard key'lerini temizlemeli.
UYARI: isNicknameAvailable 300ms debounce ile çalışmalı (API katmanında değil, client'ta).
UYARI: passwordHash hiçbir response'da dönmemeli.

Test: tests/users/update-profile.test.ts
npm test → geçmeli.
```

#### 1.5 — Entity ve Arama Modülleri

```
PROMPT:
SKILL_DATABASE_PATTERNS.md'deki "Entity Arama" bölümünü oku.
Şu dosyaları yaz:
- src/modules/search/search.router.ts
- src/modules/search/search.controller.ts
- src/modules/search/search.service.ts

UYARI: Arama normalize_turkish() fonksiyonu ile yapılmalı.
UYARI: Hem name hem alias alanlarında arama yapılmalı.
UYARI: Sonuçlar Redis'e 5 dakika cache'lenmeli.
UYARI: Rate limit: 20 istek/dakika/kullanıcı.

Test: tests/search/autocomplete.test.ts
npm test → geçmeli.
```

#### 1.6 — Soru ve Session Modülleri

```
PROMPT:
SKILL_SCORING_ENGINE.md ve SKILL_DATABASE_PATTERNS.md'yi oku.
Şu dosyaları yaz:
- src/modules/questions/questions.router.ts
- src/modules/questions/questions.controller.ts
- src/modules/questions/questions.service.ts
- src/modules/sessions/sessions.router.ts
- src/modules/sessions/sessions.controller.ts
- src/modules/sessions/sessions.service.ts
- src/modules/scoring/scoring.service.ts
- src/modules/scoring/scoring.constants.ts
- src/modules/scoring/scoring.types.ts

UYARI: Puanlama tamamen server-side. Client'tan puan kabul edilmez.
UYARI: submit → $transaction içinde GameSession + PointHistory.
UYARI: 0 puan → PointHistory'e yazılmaz.
UYARI: allSlotsFilled = true ise süre bonusu hesaplanır.
UYARI: Blur mantığı: premium olmayan kullanıcılar doğru bilmedikleri cevapları göremez.
UYARI: cheat-detect.middleware.ts session submit router'ına eklenmeli.

Test dosyaları:
- src/modules/scoring/scoring.service.test.ts (SKILL_SCORING_ENGINE.md'deki 9 senaryo)
- tests/sessions/submit.test.ts
- tests/sessions/ad-reward.test.ts

npm test → tüm testler geçmeli.
```

#### 1.7 — Leaderboard Modülü

```
PROMPT:
SKILL_REDIS_LEADERBOARD.md'yi tamamını oku.
Şu dosyaları yaz:
- src/modules/leaderboard/leaderboard.router.ts
- src/modules/leaderboard/leaderboard.controller.ts
- src/modules/leaderboard/leaderboard.service.ts

UYARI: TR leaderboard'a sadece countryCode='TR' olan kullanıcılar girer.
UYARI: addPoints pipeline ile tüm key'leri tek seferde günceller.
UYARI: getLeaderboard kullanıcının kendi sırasını listede olmasa bile döner.
UYARI: Eşitlikte nickname alfabetik sıralama uygulanır.

Test: tests/leaderboard/leaderboard.test.ts
npm test → geçmeli.
```

#### 1.8 — App Config Modülü

```
PROMPT:
Şu dosyaları yaz:
- src/modules/app-config/app-config.router.ts
- src/modules/app-config/app-config.controller.ts
- src/modules/app-config/app-config.service.ts

Response formatı:
{
  "minimum_version": "1.0.0",
  "latest_version": "1.0.0",
  "force_update": false,
  "active_event": null | { id, name, endsAt }
}

UYARI: Bu endpoint auth gerektirmez (uygulama açılışında çağrılır).
UYARI: Sonuç 5 dakika Redis'te cache'lenir.
```

#### 1.9 — Cron Jobs

```
PROMPT:
SKILL_CRON_JOBS.md'yi tamamını oku.
Şu dosyaları yaz (SKILL_CRON_JOBS.md'deki implementasyonları birebir kullan):
- src/jobs/index.ts
- src/jobs/daily-limit-reset.job.ts
- src/jobs/daily-question-selector.job.ts
- src/jobs/cooldown-cleanup.job.ts
- src/jobs/suspicious-flag-report.job.ts
- src/jobs/pool-health-check.job.ts
- src/jobs/leaderboard-archiver.job.ts
- src/jobs/archiving-auto-complete.job.ts

UYARI: Tüm timezone'lar 'Europe/Istanbul'.
UYARI: Her cron try/catch ile sarılı, hata fırlatılmaz.
UYARI: Her cron'un run*() fonksiyonu export edilir (test için).
UYARI: Leaderboard arşivlemede hata olursa Redis key silinmez.

Test dosyaları:
- tests/jobs/daily-question-selector.test.ts
- tests/jobs/pool-health-check.test.ts

npm test → geçmeli.
```

#### 1.10 — Faz 1 Final Kontrol

```
PROMPT:
SKILL_SECURITY.md'deki "Güvenlik Kontrol Listesi"ni oku.
Şu kontrolleri yap:

1. npm test → tüm testler geçiyor mu?
2. Her endpoint Zod validation'a sahip mi?
3. passwordHash hiçbir response'da var mı? (grep ile kontrol et)
4. Rate limit tüm auth endpoint'lerinde aktif mi?
5. Refresh token rotasyonu çalışıyor mu?
6. src/app.ts'de middleware sırası doğru mu?
   (helmet → cors → morgan → json → routes → error handler)

Eksik olan her şeyi düzelt, sonra tekrar npm test çalıştır.
Faz 1 ancak tüm testler geçince tamamdır.
```

---

## FAZ 2 — ADMİN PANELİ

### Oku (Bu Sırayla)
1. `SKILL_ADMIN_PANEL.md` — tamamı
2. `EKRANLAR.md` — Admin Panel bölümü (A-01'den A-10'a)
3. `SKILL_DATABASE_PATTERNS.md` — Admin sorguları bölümü

### Modül Yazım Sırası

#### 2.1 — Backend Admin Modülleri (Önce Backend, Sonra Frontend)

```
PROMPT:
SKILL_BACKEND_API.md ve SKILL_ADMIN_PANEL.md'yi oku.
Şu backend dosyalarını yaz:
- src/modules/admin/admin.router.ts
- src/modules/admin/admins/admin-auth.service.ts
- src/modules/admin/entities/ (CRUD)
- src/modules/admin/questions/ (CRUD + arşivleme + havuz sağlığı)
- src/modules/admin/events/ (CRUD + tek aktif kural)
- src/modules/admin/users/ (ban, unban, suggest-ban)
- src/modules/admin/stats/ (dashboard metrikleri)
- src/modules/admin/admins/ (admin kullanıcı yönetimi — sadece super_admin)

UYARI: Arşivleme: aktif oturum varsa status='archiving', yoksa 'archived'.
UYARI: Özel etkinlik: aynı anda sadece 1 aktif etkinlik — transaction ile garantile.
UYARI: Entity çift kayıt kontrolü: aynı isimde entity varsa uyarı dön, engelleme.
UYARI: Havuz sağlığı: 5 (danger) ve 7 (warning) eşikleri.
UYARI: Ban öneri akışı: moderator öneri yapar, super_admin onaylar.
```

#### 2.2 — Admin Frontend Temel Yapı

```
PROMPT:
SKILL_ADMIN_PANEL.md'yi oku.
Şu dosyaları yaz:
- src/config/api.ts (axios + interceptors)
- src/config/query-client.ts
- src/lib/utils.ts
- src/hooks/use-auth.ts (Zustand store)
- src/components/layout/AdminLayout.tsx (sidebar + rol bazlı menü)
- src/components/layout/ProtectedRoute.tsx
- src/App.tsx (tam router kurulumu)
- src/pages/Login.tsx

UYARI: Sidebar menü öğeleri role göre filtrelenmelidir.
UYARI: EKRANLAR.md A-01 ve A-02 tasarımlarını referans al.
npm run dev → login ekranı açılmalı.
```

#### 2.3 — Dashboard

```
PROMPT:
SKILL_ADMIN_PANEL.md ve EKRANLAR.md A-02'yi oku.
Şu dosyaları yaz:
- src/pages/Dashboard.tsx
- src/components/dashboard/PoolHealthWidget.tsx
- src/components/dashboard/StatCard.tsx
- src/components/dashboard/ActiveQuestionsTable.tsx

UYARI: PoolHealthWidget 5 (kırmızı) ve 7 (sarı) eşiklerini kullanır.
UYARI: Dashboard 30 saniyede bir otomatik yenilenir (refetchInterval).
UYARI: Şüpheli oturum uyarısı sarı banner olarak gösterilir.
```

#### 2.4 — Soru Yönetimi

```
PROMPT:
SKILL_ADMIN_PANEL.md ve EKRANLAR.md A-03, A-04, A-05'i oku.
Şu dosyaları yaz:
- src/pages/questions/QuestionList.tsx
- src/pages/questions/QuestionCreate.tsx
- src/pages/questions/QuestionEdit.tsx
- src/pages/questions/QuestionCalendar.tsx
- src/components/questions/AnswerDragList.tsx (@dnd-kit/sortable)
- src/components/questions/SortableAnswerRow.tsx
- src/components/questions/EntitySearch.tsx (inline entity modal dahil)
- src/hooks/use-questions.ts

UYARI: Drag-drop cevap listesinde rank otomatik belirlenir, elle girilmez.
UYARI: stat_display boş bırakılabilir ama uyarı gösterilir.
UYARI: Entity arama debounced (300ms) olmalıdır.
UYARI: Takvim ekranında atanmamış günler kırmızı, eksik modül sarı gösterilir.
```

#### 2.5 — Entity, Kullanıcı, Etkinlik, İstatistik, Ayarlar

```
PROMPT:
SKILL_ADMIN_PANEL.md ve EKRANLAR.md A-06, A-07, A-08, A-09, A-10'u oku.
Şu dosyaları yaz:
- src/pages/entities/EntityList.tsx (drawer ile düzenleme)
- src/pages/users/UserList.tsx (ban akışı, şüpheli filtre)
- src/pages/users/UserDetailModal.tsx
- src/pages/events/EventList.tsx
- src/pages/stats/StatsPage.tsx
- src/pages/settings/SettingsPage.tsx (version yönetimi + admin kullanıcılar)

UYARI: Moderator sadece ban öneri gönderebilir, uygulayamaz.
UYARI: Super admin ban onaylama ekranı ayrı olmalı (pending list).
UYARI: Entity listesinde "kaç soruda kullanıldı" sayısı gösterilmeli.
```

#### 2.6 — Faz 2 Final Kontrol

```
PROMPT:
Admin panelinde şu senaryoları manuel test et ve raporla:

1. Login → Çıkış akışı
2. Soru oluştur (drag-drop cevap sırala, entity ekle, yayınla)
3. Moderator: kullanıcıya ban öner
4. Super admin: ban önerisini onayla
5. Dashboard'da havuz uyarısı görünüyor mu?
6. Force update switch'ini aç/kapa → /api/v1/app/config değişiyor mu?

Eksik olan her şeyi düzelt.
Faz 2 ancak tüm senaryolar çalışınca tamamdır.
```

---

## FAZ 3 — FLUTTER MOBİL UYGULAMA

### Oku (Bu Sırayla)
1. `SKILL_FLUTTER_ARCHITECTURE.md` — tamamı (bir kez, tüm faz boyunca referans)
2. `EKRANLAR.md` — tamamı

### Ekran Yazım Sırası ve Prompt Zincirleri

#### 3.1 — Core Katman

```
PROMPT:
SKILL_FLUTTER_ARCHITECTURE.md'yi tamamını oku.
Şu dosyaları yaz:
- lib/core/constants/app_colors.dart
- lib/core/constants/app_text_styles.dart
- lib/core/constants/app_sizes.dart
- lib/core/constants/app_strings.dart
- lib/core/constants/game_constants.dart
- lib/core/errors/app_exception.dart
- lib/core/network/dio_client.dart
- lib/core/network/auth_interceptor.dart (401 → refresh → retry)
- lib/core/network/api_endpoints.dart
- lib/core/router/app_router.dart (GoRouter + redirect mantığı)
- lib/core/router/route_names.dart
- lib/core/storage/secure_storage.dart
- lib/core/storage/hive_storage.dart
- lib/core/storage/prefs_storage.dart
- lib/shared/providers/auth_provider.dart
- lib/shared/providers/user_provider.dart
- lib/shared/widgets/primary_button_widget.dart
- lib/shared/widgets/error_screen_widget.dart
- lib/shared/widgets/loading_widget.dart

UYARI: AppColors SKILL_FLUTTER_ARCHITECTURE.md'deki token tablosunu birebir kullan.
UYARI: AuthInterceptor 401 gelince refresh dener, başarısız olursa clearAll() çağırır.
UYARI: GoRouter redirect sırası: force_update → ban → needsNickname → needsAvatar → home.
flutter analyze → sıfır hata.
```

#### 3.2 — Splash, Onboarding, Auth Ekranları

```
PROMPT:
SKILL_FLUTTER_ARCHITECTURE.md ve EKRANLAR.md E-01, E-02, E-02b, E-03'ü oku.
Şu dosyaları yaz:
- lib/features/app_config/ (data + domain + presentation)
- lib/features/onboarding/ (splash + onboarding)
- lib/features/auth/data/auth_repository.dart
- lib/features/auth/domain/auth_model.dart
- lib/features/auth/presentation/login_screen.dart
- lib/features/auth/presentation/ban_screen.dart

UYARI: Splash ekranında /api/v1/app/config çağrılır, force_update kontrolü yapılır.
UYARI: Login ekranında Apple butonu iOS'ta zorunlu, Android'de gösterilir ama opsiyonel.
UYARI: E-posta giriş/kayıt alt sheet (bottom sheet) olarak açılır.
flutter analyze → sıfır hata.
```

#### 3.3 — Nickname ve Avatar Ekranları

```
PROMPT:
EKRANLAR.md E-04 ve E-05'i oku.
Şu dosyaları yaz:
- lib/features/auth/presentation/nickname_screen.dart
- lib/features/auth/presentation/avatar_country_screen.dart

UYARI: Nickname arama 300ms debounce ile API'ye gider.
UYARI: Nickname durumları: boş / yazılıyor / alınmış / geçersiz / müsait.
UYARI: Ülke telefon locale'inden otomatik seçilir, değiştirilebilir.
UYARI: 20-30 adet avatar assets/avatars/ klasöründen yüklenir.
flutter analyze → sıfır hata.
```

#### 3.4 — Ana Ekran

```
PROMPT:
EKRANLAR.md E-06'yı oku.
Şu dosyaları yaz:
- lib/features/home/data/home_repository.dart
- lib/features/home/domain/daily_question_model.dart
- lib/features/home/presentation/home_screen.dart
- lib/features/home/presentation/home_provider.dart
- lib/features/home/presentation/widgets/module_card_widget.dart
- lib/features/home/presentation/widgets/special_event_banner_widget.dart

UYARI: Modül kartı 3 durum göstermeli: normal / tamamlandı / hak bitti.
UYARI: Hak bitti durumunda reklam butonu gösterilir.
UYARI: Özel etkinlik aktifse banner en üstte gösterilir.
UYARI: Pull-to-refresh çalışmalı.
flutter analyze → sıfır hata.
```

#### 3.5 — Challenge Tanıtım ve Oyun Ekranı

```
PROMPT:
SKILL_FLUTTER_GAME_SCREEN.md'yi tamamını oku.
EKRANLAR.md E-07 ve E-08'i oku.
Şu dosyaları yaz:
- lib/features/game/data/game_repository.dart
- lib/features/game/data/search_repository.dart
- lib/features/game/domain/game_session_model.dart
- lib/features/game/domain/search_result_model.dart
- lib/features/game/presentation/challenge_intro_screen.dart
- lib/features/game/presentation/game_screen.dart
- lib/features/game/presentation/game_provider.dart
- lib/features/game/presentation/widgets/timer_widget.dart
- lib/features/game/presentation/widgets/autocomplete_widget.dart
- lib/features/game/presentation/widgets/answer_slot_widget.dart
- lib/features/game/presentation/widgets/empty_slot_widget.dart
- lib/features/game/presentation/widgets/finish_button_widget.dart

UYARI: Timer sunucudan gelen startedAt'a göre hesaplanır, client time değil.
UYARI: Timer renk geçişleri: >10s mavi, 10-4s sarı, ≤3s kırmızı + pulse animasyonu.
UYARI: Titreşim: 10s kaldığında medium, 3s kaldığında heavy, 0s'de vibrate.
UYARI: Autocomplete 300ms debounce, min 2 karakter, max 6 sonuç.
UYARI: Seçilen entity'ler arama sonuçlarında görünmez.
UYARI: FinishButton: 0 cevap=disabled, 1+ cevap=aktif, tümü dolu=yeşil süre bonusu.
UYARI: WillPopScope: çıkış dialogu göster, süre devam eder uyarısı ver.
UYARI: Süre dolunca 0 cevap olsa bile submit gönderilir.
flutter analyze → sıfır hata.
```

#### 3.6 — Sonuç Ekranı

```
PROMPT:
SKILL_FLUTTER_GAME_SCREEN.md'nin sonuç ekranı bölümlerini oku.
EKRANLAR.md E-09'u oku.
Şu dosyaları yaz:
- lib/features/result/data/result_repository.dart
- lib/features/result/data/ad_repository.dart (AdMob rewarded ad)
- lib/features/result/domain/result_model.dart
- lib/features/result/presentation/result_screen.dart
- lib/features/result/presentation/result_provider.dart
- lib/features/result/presentation/widgets/answer_row_widget.dart
- lib/features/result/presentation/widgets/blur_overlay_widget.dart
- lib/features/result/presentation/widgets/score_counter_widget.dart
- lib/features/result/presentation/widgets/rank_change_widget.dart
- lib/features/result/presentation/widgets/ad_reward_button_widget.dart

UYARI: Blur — BackdropFilter + ImageFilter.blur(sigmaX:8, sigmaY:8) kullan.
UYARI: Puan sayacı TweenAnimationBuilder ile 0'dan hedefe 1200ms'de sayar.
UYARI: Sıralama değişimi (#142 → #139) lazy yüklenir (1-2sn sonra).
UYARI: Reklam izlendikten sonra puan ve sıralama güncellenir, buton gizlenir.
UYARI: Yanlış cevap yanına sıra bilgisi YAZILMAZ ("bu listede değil" yazılır).
UYARI: adMultiplied=true ise reklam butonu hiç render edilmez.
UYARI: flutter_animate ile cevap satırları sıralı fade-in (80ms arayla).
flutter analyze → sıfır hata.
```

#### 3.7 — Leaderboard, Profil, Takvim, İstatistik

```
PROMPT:
EKRANLAR.md E-10, E-11, E-12, E-13, E-15'i oku.
Şu dosyaları yaz:
- lib/features/leaderboard/ (tam implementasyon)
- lib/features/profile/ (profil + ayarlar ekranı)
- lib/features/calendar/ (takvim ekranı)
- lib/features/stats/ (istatistik ekranı)

UYARI: Leaderboard 3 sekme: scope (TR/Global) + period (alltime/weekly/monthly) + module.
UYARI: Kullanıcının kendi sırası her zaman en altta sabit gösterilir.
UYARI: Sıralama renkleri: 🥇=altın, 🥈=gümüş, 🥉=bronz.
UYARI: Ayarlar ekranında nickname değişikliği bottom sheet ile yapılır.
UYARI: Takvim ekranında ✅ (çözüldü) / ⬜ (çözülmedi) günler gösterilir.
UYARI: Geçmiş dönem sıralamaları profil ekranında gösterilir (leaderboard_snapshots'tan).
flutter analyze → sıfır hata.
```

#### 3.8 — Alt Navigasyon

```
PROMPT:
SKILL_FLUTTER_ARCHITECTURE.md'deki BottomNav bölümünü oku.
Şu dosyaları yaz:
- lib/shared/widgets/bottom_nav_widget.dart

UYARI: 5 sekme: Ana / Sıralama / Takvim / İstatistik / Profil.
UYARI: GoRouter ShellRoute kullanılır, her sekme kendi navigator stack'ine sahip.
flutter analyze → sıfır hata.
```

#### 3.9 — Faz 3 Final Kontrol

```
PROMPT:
Şu kontrolleri yap:

1. flutter analyze → sıfır hata
2. flutter test → tüm testler geçiyor mu?
3. Şu senaryoları elle test et (emülatör/cihaz):
   a. Google giriş → nickname → avatar → ana ekran
   b. Soru başlat → cevap gir → bitir → sonuç ekranı
   c. Blur çalışıyor mu? (premium olmayan kullanıcıda)
   d. Reklam izle → puan güncelleniyor mu?
   e. Timer 0'a inince otomatik submit oluyor mu?
   f. Uygulama arka plana gidip gelince timer doğru devam ediyor mu?
   g. Force update ekranı çıkıyor mu? (API'den force_update=true gönder)
4. Eksik olan her şeyi düzelt.
```

---

## FAZ 4 — İÇERİK VE DEPLOYMENT

### 4.1 — İçerik Girişi

```
PROMPT:
Admin paneli üzerinden şu içerikleri gir:
- Her modül için en az 30 soru (120 toplam)
- Her soruda en az 3, en fazla 10 cevap
- Zorluk dağılımı: %30 kolay, %50 orta, %20 zor
- Özel etkinlik: Dünya Kupası 2026 (en az 10 soru)
- Her soru için en az 7 gün ileri tarih ata (takvim dolu olsun)

Sonra havuz sağlığını kontrol et: her modül için 14+ soru hazır olmalı.
```

### 4.2 — Production Deployment

```
PROMPT:
Şu adımları sırayla uygula:

BACKEND (Railway):
1. railway.app → New Project → GitHub repo bağla
2. backend/ klasörünü service olarak ekle
3. Environment variables'ları gir (production .env)
4. NODE_ENV=production
5. Start command: npm run build && npx prisma migrate deploy && npm start
6. Deploy → URL al

ADMIN (Vercel):
1. vercel.com → New Project → GitHub repo bağla
2. Root Directory: admin/
3. VITE_API_BASE_URL=https://[railway-url]/api
4. Deploy → URL al

FLUTTER:
1. android/app/google-services.json ekle
2. ios/Runner/GoogleService-Info.plist ekle
3. AdMob App ID'lerini güncelle
4. flutter build apk --release (Android)
5. flutter build ipa --release (iOS)
6. App Store Connect + Google Play Console'a yükle

KONTROL:
- Production API'ye istek at: GET /api/v1/app/config → 200 dönmeli
- Admin paneli açılıyor mu?
- Flutter uygulaması production API'ye bağlanıyor mu?
```

---

## GENEL KURALLAR — GEMİNİ İÇİN

1. **Skill dosyalarını önce oku, sonra yaz.** Prompt başında belirtilen skill'leri okumadan kod yazmaya başlama.

2. **Her alt bölüm bitince test çalıştır.** `npm test` veya `flutter analyze` geçmeden bir sonraki bölüme geçme.

3. **Basite kaçma.** Widget'ları yarım bırakma, animasyonları atlama, blur'u "şimdilik" koyma.

4. **Placeholder bırakma.** `// TODO`, `// implement later`, `throw UnimplementedError()` kabul edilmez. Bir şey yazıyorsan tamamla.

5. **Skill dosyasındaki "Kesinlikle Yapılmayacaklar" bölümünü her zaman kontrol et.**

6. **Dosya yoksa oluştur.** DOSYA_AGACI.md'de olan her dosya oluşturulur. Atlanmaz.

7. **Tablo üretme, kod üret.** Markdown tablo ile "yapılacaklar listesi" yerine doğrudan çalışan kod yaz.

8. **Her modülün testi var mı kontrol et.** Test yoksa yaz. Test geçmiyorsa geç.
