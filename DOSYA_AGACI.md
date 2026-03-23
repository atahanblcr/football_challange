# FOOTBALL CHALLENGE — PROJE DOSYA AĞACI

> Bu dosya projenin tam dizin ve dosya yapısını tanımlar.
> Gemini bu dosyayı okuyarak monorepo yapısını eksiksiz oluşturur.
> Hiçbir dosya veya klasör atlanamaz. Eksik klasör açılmadan, eksik dosya oluşturulmadan geliştirmeye başlanamaz.

---

## MONOREPO KÖK YAPISI

```
football-challenge/
├── mobile/                          # Flutter uygulaması (iOS + Android)
├── backend/                         # Node.js + TypeScript API
├── admin/                           # React admin paneli
├── shared/                          # Ortak tip tanımları ve sabitler
├── .github/
│   └── workflows/
│       ├── mobile-ci.yml            # Flutter test + build pipeline
│       ├── backend-ci.yml           # Node.js test + deploy pipeline
│       └── admin-ci.yml             # React build + deploy pipeline
├── .gitignore                       # Kök .gitignore (tüm projeler için)
├── README.md                        # Proje genel tanıtımı ve kurulum adımları
├── GEMINI.md                        # Master proje dokümantasyonu (bu proje)
├── EKRANLAR.md                      # Ekran tasarımları ve UI detayları
└── DOSYA_AGACI.md                   # Bu dosya
```

---

## SHARED — ORTAK TİP TANIMLARI

```
shared/
├── src/
│   ├── types/
│   │   ├── entity.types.ts          # EntityType enum, Entity arayüzü
│   │   ├── question.types.ts        # Question, QuestionAnswer arayüzleri
│   │   ├── user.types.ts            # User, SubscriptionTier arayüzleri
│   │   ├── session.types.ts         # GameSession, SessionResult arayüzleri
│   │   ├── leaderboard.types.ts     # LeaderboardEntry, Scope, Period arayüzleri
│   │   └── api.types.ts             # ApiResponse, ApiError arayüzleri
│   └── constants/
│       ├── modules.ts               # MODULE_LIST, MODULE_LABELS
│       ├── scoring.ts               # COOLDOWN_DAYS=90, MIN_SEC_PER_ANSWER=4, vb.
│       └── limits.ts                # DAILY_FREE_LIMIT=4, DAILY_PREMIUM_LIMIT=8, vb.
├── package.json
└── tsconfig.json
```

---

## BACKEND — NODE.JS + TYPESCRIPT API

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts              # Prisma client singleton
│   │   ├── redis.ts                 # Upstash Redis client
│   │   ├── supabase.ts              # Supabase admin client (Storage)
│   │   └── env.ts                   # Zod ile ortam değişkeni doğrulama
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts       # JWT doğrulama, req.user ekleme
│   │   ├── admin-auth.middleware.ts # Admin session doğrulama
│   │   ├── rbac.middleware.ts       # Rol bazlı erişim kontrolü
│   │   ├── rate-limit.middleware.ts # express-rate-limit konfigürasyonları
│   │   ├── cheat-detect.middleware.ts # Hile tespiti: submitted-started < N×4s → flag
│   │   └── error-handler.middleware.ts # Merkezi hata yakalayıcı, ApiError formatı
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.router.ts       # POST /auth/google, /apple, /email/*, /refresh, DELETE /logout
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts      # OAuth doğrulama, JWT üretme, refresh token rotasyonu
│   │   │   └── auth.schema.ts       # Zod şemaları (login, register)
│   │   │
│   │   ├── users/
│   │   │   ├── users.router.ts      # GET/PATCH /users/me, DELETE /users/me, GET /check-nickname/:nick
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts     # Profil yönetimi, nickname kontrolü, hesap silme + Redis temizleme
│   │   │   └── users.schema.ts      # Zod şemaları (updateProfile)
│   │   │
│   │   ├── questions/
│   │   │   ├── questions.router.ts  # GET /questions/daily, GET /questions/:id/meta, POST /questions/:id/start
│   │   │   ├── questions.controller.ts
│   │   │   ├── questions.service.ts # Günlük soru çekme, oturum başlatma, cooldown kontrolü
│   │   │   └── questions.schema.ts
│   │   │
│   │   ├── sessions/
│   │   │   ├── sessions.router.ts   # POST /sessions/:id/submit, GET /sessions/:id/result, POST /sessions/:id/ad-reward
│   │   │   ├── sessions.controller.ts
│   │   │   ├── sessions.service.ts  # Submit akışı, blur mantığı, ad-reward
│   │   │   └── sessions.schema.ts   # Zod (submitAnswers: UUID[])
│   │   │
│   │   ├── scoring/
│   │   │   ├── scoring.service.ts   # Puanlama motoru (Bölüm 6 formülü)
│   │   │   └── scoring.service.test.ts  # Birim testleri (5 senaryo)
│   │   │
│   │   ├── search/
│   │   │   ├── search.router.ts     # GET /search?q=&type=
│   │   │   ├── search.controller.ts
│   │   │   └── search.service.ts    # PostgreSQL FTS + Redis cache
│   │   │
│   │   ├── leaderboard/
│   │   │   ├── leaderboard.router.ts  # GET /leaderboard, GET /leaderboard/me
│   │   │   ├── leaderboard.controller.ts
│   │   │   └── leaderboard.service.ts # Redis ZADD, ZREVRANK, ZREVRANGE, ZREM
│   │   │
│   │   ├── app-config/
│   │   │   ├── app-config.router.ts   # GET /app/config
│   │   │   ├── app-config.controller.ts
│   │   │   └── app-config.service.ts  # minimum_version, force_update, active_event
│   │   │
│   │   └── admin/
│   │       ├── admin.router.ts        # Tüm /api/admin/* route'ları birleştirir
│   │       │
│   │       ├── entities/
│   │       │   ├── admin-entities.router.ts
│   │       │   ├── admin-entities.controller.ts
│   │       │   ├── admin-entities.service.ts  # CRUD, çift kayıt uyarısı
│   │       │   └── admin-entities.schema.ts
│   │       │
│   │       ├── questions/
│   │       │   ├── admin-questions.router.ts
│   │       │   ├── admin-questions.controller.ts
│   │       │   ├── admin-questions.service.ts  # CRUD, soft arşivleme, havuz sağlığı
│   │       │   └── admin-questions.schema.ts
│   │       │
│   │       ├── events/
│   │       │   ├── admin-events.router.ts
│   │       │   ├── admin-events.controller.ts
│   │       │   ├── admin-events.service.ts     # Tek aktif etkinlik garantisi
│   │       │   └── admin-events.schema.ts
│   │       │
│   │       ├── users/
│   │       │   ├── admin-users.router.ts
│   │       │   ├── admin-users.controller.ts
│   │       │   └── admin-users.service.ts      # Ban, unban, flaglı listeleme
│   │       │
│   │       ├── stats/
│   │       │   ├── admin-stats.router.ts        # GET /admin/stats/dashboard
│   │       │   ├── admin-stats.controller.ts
│   │       │   └── admin-stats.service.ts       # DAU, MAU, churn, modül aktifliği vb.
│   │       │
│   │       └── admins/
│   │           ├── admin-admins.router.ts       # Super admin: CRUD diğer adminler
│   │           ├── admin-admins.controller.ts
│   │           └── admin-admins.service.ts
│   │
│   ├── jobs/
│   │   ├── index.ts                 # Tüm cron'ları kaydeder, başlatır
│   │   ├── daily-limit-reset.job.ts        # Her gün UTC+3 00:00 — günlük sayaç sıfırlama
│   │   ├── daily-question-selector.job.ts  # Her gün UTC+3 00:05 — modül başına random soru seç
│   │   ├── cooldown-cleanup.job.ts         # Her gün UTC+3 01:00 — 90 günü dolan soruları havuza al
│   │   ├── suspicious-flag-report.job.ts   # Her gün UTC+3 08:00 — flaglı oturum raporu
│   │   ├── leaderboard-archiver.job.ts     # Haftalık/Aylık/3 Aylık — snapshot + Redis sıfırlama
│   │   └── pool-health-check.job.ts        # Her gün UTC+3 09:00 — havuz uyarısı
│   │
│   ├── utils/
│   │   ├── jwt.util.ts              # access/refresh token üret/doğrula
│   │   ├── bcrypt.util.ts           # Şifre hash / compare
│   │   ├── normalize-text.util.ts   # Türkçe karakter normalizasyonu (İ→i, Ş→ş vb.)
│   │   ├── referral-code.util.ts    # 10 karakterli benzersiz kod üretici
│   │   ├── redis-keys.util.ts       # Leaderboard ve cache key oluşturucu
│   │   └── logger.util.ts           # Structured loglama (timestamp, endpoint, user_id)
│   │
│   ├── errors/
│   │   ├── api-error.ts             # ApiError sınıfı (code, message, statusCode)
│   │   └── error-codes.ts           # Tüm hata kodları sabit olarak (SESSION_ALREADY_EXISTS vb.)
│   │
│   └── app.ts                       # Express app kurulumu, middleware sırası, router bağlantısı
│
├── prisma/
│   ├── schema.prisma                # Tüm tablo tanımları (GEMINI.md Bölüm 5'e göre)
│   └── migrations/                  # Prisma migration dosyaları (git'e commit edilir)
│       └── 20250101000000_init/
│           └── migration.sql
│
├── tests/
│   ├── setup.ts                     # Jest global setup, test DB bağlantısı
│   ├── auth/
│   │   ├── google-oauth.test.ts
│   │   └── token-refresh.test.ts
│   ├── scoring/
│   │   └── scoring.service.test.ts  # 5 birim test senaryosu
│   ├── sessions/
│   │   ├── submit.test.ts           # Çift oturum, hile tespiti, blur
│   │   └── ad-reward.test.ts
│   ├── leaderboard/
│   │   └── leaderboard.test.ts
│   ├── search/
│   │   └── autocomplete.test.ts
│   └── rate-limit/
│       └── rate-limit.test.ts
│
├── .env                             # GIT'E EKLENMEMELİ
├── .env.example                     # Tüm değişkenlerin açıklamalı şablonu
├── .gitignore
├── jest.config.ts
├── tsconfig.json
├── package.json
└── Dockerfile                       # Railway deployment için
```

---

## MOBILE — FLUTTER UYGULAMASI

```
mobile/
├── android/
│   ├── app/
│   │   ├── build.gradle             # AdMob App ID, signingConfigs
│   │   ├── google-services.json     # GIT'E EKLENMEMELİ (Google Sign-In)
│   │   └── src/main/
│   │       ├── AndroidManifest.xml  # İzinler: INTERNET, AD_ID
│   │       └── res/
│   │           └── values/
│   │               └── strings.xml  # AdMob App ID referansı
│   └── build.gradle
│
├── ios/
│   ├── Runner/
│   │   ├── Info.plist               # Apple Sign In, URL schemes, AdMob App ID
│   │   ├── GoogleService-Info.plist # GIT'E EKLENMEMELİ (Google Sign-In)
│   │   └── AppDelegate.swift        # AdMob başlatma
│   └── Podfile
│
├── lib/
│   ├── main.dart                    # Uygulama giriş noktası, Riverpod + GoRouter init
│   │
│   ├── core/
│   │   ├── constants/
│   │   │   ├── app_colors.dart      # Renk sabitleri (EKRANLAR.md'deki token tablosu)
│   │   │   ├── app_text_styles.dart # Yazı stilleri
│   │   │   ├── app_sizes.dart       # Padding, radius, icon size sabitleri
│   │   │   ├── app_strings.dart     # Tüm UI metinleri (i18n alt yapısı için)
│   │   │   └── game_constants.dart  # COOLDOWN_DAYS, MIN_SEC_PER_ANSWER, MAX_TIME_BONUS_POINTS vb.
│   │   │
│   │   ├── errors/
│   │   │   ├── app_exception.dart   # ApiException sınıfı
│   │   │   └── error_codes.dart     # Hata kodu sabitleri (SESSION_ALREADY_EXISTS vb.)
│   │   │
│   │   ├── network/
│   │   │   ├── dio_client.dart      # Dio singleton, baseUrl, timeout
│   │   │   ├── auth_interceptor.dart # Access token header ekleme, 401 → refresh
│   │   │   └── api_endpoints.dart   # Tüm endpoint URL sabitleri
│   │   │
│   │   ├── router/
│   │   │   ├── app_router.dart      # GoRouter tanımı, tüm route'lar
│   │   │   └── route_names.dart     # Route isim sabitleri
│   │   │
│   │   ├── storage/
│   │   │   ├── secure_storage.dart  # flutter_secure_storage wrapper (JWT)
│   │   │   ├── hive_storage.dart    # Hive wrapper (entity cache, leaderboard snapshot)
│   │   │   └── prefs_storage.dart   # SharedPreferences wrapper (tema, dil tercihi)
│   │   │
│   │   └── utils/
│   │       ├── date_util.dart       # Tarih formatlama
│   │       ├── text_normalize.dart  # Türkçe karakter normalizasyonu
│   │       └── number_format.dart   # Puan, sayı formatlama
│   │
│   ├── features/
│   │   │
│   │   ├── app_config/
│   │   │   ├── data/
│   │   │   │   └── app_config_repository.dart  # GET /app/config
│   │   │   ├── domain/
│   │   │   │   └── app_config_model.dart       # minimum_version, force_update, active_event
│   │   │   └── presentation/
│   │   │       └── force_update_screen.dart    # E-02b ekranı
│   │   │
│   │   ├── onboarding/
│   │   │   ├── data/
│   │   │   │   └── onboarding_repository.dart  # İlk kurulum kontrolü (SharedPreferences)
│   │   │   └── presentation/
│   │   │       ├── onboarding_screen.dart      # E-02: 3 sayfalı onboarding (PageView)
│   │   │       └── splash_screen.dart          # E-01: Splash
│   │   │
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   ├── auth_repository.dart        # API çağrıları (google, apple, email)
│   │   │   │   └── token_repository.dart       # JWT secure storage okuma/yazma
│   │   │   ├── domain/
│   │   │   │   ├── auth_model.dart             # AuthResponse (accessToken, refreshToken, isNewUser)
│   │   │   │   └── user_model.dart             # User entity
│   │   │   └── presentation/
│   │   │       ├── login_screen.dart           # E-03: Giriş / Kayıt
│   │   │       ├── nickname_screen.dart        # E-04: Nickname seçimi
│   │   │       ├── avatar_country_screen.dart  # E-05: Avatar + Ülke + Referral
│   │   │       └── ban_screen.dart             # E-14: Ban ekranı
│   │   │
│   │   ├── home/
│   │   │   ├── data/
│   │   │   │   └── home_repository.dart        # GET /questions/daily
│   │   │   ├── domain/
│   │   │   │   └── daily_question_model.dart   # Modül meta bilgileri
│   │   │   └── presentation/
│   │   │       ├── home_screen.dart            # E-06: Ana ekran
│   │   │       ├── widgets/
│   │   │       │   ├── module_card_widget.dart # Normal / Tamamlandı / Hak Bitti kartı
│   │   │       │   └── special_event_banner_widget.dart
│   │   │       └── home_provider.dart          # Riverpod provider
│   │   │
│   │   ├── game/
│   │   │   ├── data/
│   │   │   │   ├── game_repository.dart        # POST /questions/:id/start, POST /sessions/:id/submit
│   │   │   │   └── search_repository.dart      # GET /search (autocomplete)
│   │   │   ├── domain/
│   │   │   │   ├── game_session_model.dart     # Aktif oturum verisi
│   │   │   │   └── search_result_model.dart    # Autocomplete sonuçları
│   │   │   └── presentation/
│   │   │       ├── challenge_intro_screen.dart # E-07: Modül detay / Challenge tanıtım
│   │   │       ├── game_screen.dart            # E-08: Oyun ekranı
│   │   │       └── widgets/
│   │   │           ├── timer_widget.dart       # Süre sayacı (renk geçişli, titreşimli)
│   │   │           ├── autocomplete_widget.dart# Arama kutusu + dropdown
│   │   │           ├── answer_slot_widget.dart # Seçilen cevap chip'i (X butonu)
│   │   │           ├── empty_slot_widget.dart  # Boş slot göstergesi
│   │   │           └── finish_button_widget.dart # Pasif/Aktif/Süre Bonusu durumları
│   │   │
│   │   ├── result/
│   │   │   ├── data/
│   │   │   │   ├── result_repository.dart      # GET /sessions/:id/result
│   │   │   │   └── ad_repository.dart          # POST /sessions/:id/ad-reward + AdMob
│   │   │   ├── domain/
│   │   │   │   └── result_model.dart           # SessionResult, AnswerRow (correct/wrong/blurred)
│   │   │   └── presentation/
│   │   │       ├── result_screen.dart          # E-09: Sonuç ekranı
│   │   │       └── widgets/
│   │   │           ├── answer_row_widget.dart  # ✅ Doğru / 🔵 Blur / ❌ Yanlış satırı
│   │   │           ├── blur_overlay_widget.dart# BackdropFilter + ImageFilter.blur
│   │   │           ├── score_counter_widget.dart # TweenAnimationBuilder puan sayacı
│   │   │           ├── rank_change_widget.dart # "#142 → #139" lazy yükleme
│   │   │           └── ad_reward_button_widget.dart # isAdLoaded kontrolü
│   │   │
│   │   ├── leaderboard/
│   │   │   ├── data/
│   │   │   │   └── leaderboard_repository.dart # GET /leaderboard, /leaderboard/me
│   │   │   ├── domain/
│   │   │   │   └── leaderboard_model.dart      # LeaderboardEntry, scope, period, module
│   │   │   └── presentation/
│   │   │       ├── leaderboard_screen.dart     # E-10: Sıralama ekranı
│   │   │       └── widgets/
│   │   │           ├── leaderboard_tabs_widget.dart    # Scope / Period / Modül sekmeleri
│   │   │           ├── leaderboard_row_widget.dart     # 🥇🥈🥉 + normal satır
│   │   │           └── my_rank_sticky_widget.dart      # Altta sabit kullanıcı satırı
│   │   │
│   │   ├── profile/
│   │   │   ├── data/
│   │   │   │   └── profile_repository.dart     # GET /users/me, GET /users/me/history
│   │   │   ├── domain/
│   │   │   │   └── profile_model.dart          # Kullanıcı, istatistikler, geçmiş dönem
│   │   │   └── presentation/
│   │   │       ├── profile_screen.dart         # E-11: Profil
│   │   │       ├── settings_screen.dart        # E-12: Ayarlar
│   │   │       └── widgets/
│   │   │           ├── stat_card_widget.dart   # 4'lü istatistik kartı
│   │   │           ├── badge_widget.dart       # Rozet gösterimi
│   │   │           ├── module_rank_widget.dart # Modül bazlı sıralama satırı
│   │   │           └── history_rank_widget.dart# Geçmiş dönem sıralaması
│   │   │
│   │   ├── calendar/
│   │   │   ├── data/
│   │   │   │   └── calendar_repository.dart    # Geçmiş oturumları çek
│   │   │   └── presentation/
│   │   │       ├── calendar_screen.dart        # E-13: Takvim / Arşiv
│   │   │       └── widgets/
│   │   │           └── calendar_day_widget.dart # ✅ / ⬜ gün göstergesi
│   │   │
│   │   └── stats/
│   │       ├── data/
│   │       │   └── stats_repository.dart
│   │       └── presentation/
│   │           └── stats_screen.dart           # E-15: İstatistik ekranı
│   │
│   └── shared/
│       ├── widgets/
│       │   ├── primary_button_widget.dart      # Ana buton (yükleniyor durumu dahil)
│       │   ├── secondary_button_widget.dart    # İkincil buton
│       │   ├── error_screen_widget.dart        # Genel hata ekranı (retry butonu)
│       │   ├── loading_widget.dart             # Yükleniyor göstergesi
│       │   ├── country_flag_widget.dart        # Bayrak emoji gösterimi
│       │   ├── difficulty_badge_widget.dart    # ⭐☆☆ / ⭐⭐☆ / ⭐⭐⭐
│       │   └── bottom_nav_widget.dart          # Alt navigasyon barı (5 sekme)
│       └── providers/
│           ├── auth_provider.dart              # Oturum durumu (giriş/çıkış/ban)
│           ├── user_provider.dart              # Aktif kullanıcı verisi
│           └── active_event_provider.dart      # Aktif özel etkinlik bilgisi
│
├── test/
│   ├── unit/
│   │   ├── scoring_test.dart                  # Puanlama formülü birim testleri
│   │   └── normalize_text_test.dart           # Türkçe karakter normalizasyonu
│   └── widget/
│       ├── game_screen_test.dart              # Slot, autocomplete, bitir butonu
│       ├── result_screen_test.dart            # Blur, puan animasyonu, reklam butonu
│       └── timer_widget_test.dart             # Renk geçişleri, titreşim
│
├── assets/
│   ├── images/
│   │   ├── logo.png
│   │   └── onboarding/
│   │       ├── onboarding_1.png
│   │       ├── onboarding_2.png
│   │       └── onboarding_3.png
│   ├── avatars/
│   │   ├── avatar_01.png                      # 20-30 adet hazır avatar
│   │   ├── avatar_02.png
│   │   └── ...
│   └── animations/
│       └── confetti.json                      # Lottie: yüksek puan confetti
│
├── .env                                       # GIT'E EKLENMEMELİ
├── .env.example
├── .gitignore
├── pubspec.yaml                               # Tüm bağımlılıklar
├── pubspec.lock                               # GIT'E EKLENMELİ (Flutter kuralı)
├── analysis_options.yaml                      # Lint kuralları
└── README.md
```

---

## ADMIN — REACT WEB PANELİ

```
admin/
├── src/
│   ├── main.tsx                     # Vite giriş noktası
│   ├── App.tsx                      # Router + QueryClientProvider
│   │
│   ├── config/
│   │   ├── api.ts                   # Axios instance, admin session header
│   │   └── query-client.ts          # TanStack Query client konfigürasyonu
│   │
│   ├── lib/
│   │   ├── utils.ts                 # cn() (tailwind merge), tarih format
│   │   └── constants.ts             # Modül listesi, zorluk seviyeleri vb.
│   │
│   ├── types/
│   │   ├── entity.types.ts
│   │   ├── question.types.ts
│   │   ├── user.types.ts
│   │   └── stats.types.ts
│   │
│   ├── hooks/
│   │   ├── use-auth.ts              # Admin oturum yönetimi
│   │   ├── use-entities.ts          # TanStack Query: entity listesi ve CRUD
│   │   ├── use-questions.ts         # TanStack Query: soru listesi ve CRUD
│   │   ├── use-users.ts             # TanStack Query: kullanıcı listesi, ban
│   │   ├── use-stats.ts             # TanStack Query: dashboard metrikleri
│   │   └── use-events.ts            # TanStack Query: özel etkinlikler
│   │
│   ├── pages/
│   │   ├── Login.tsx                # A-01: Admin giriş
│   │   ├── Dashboard.tsx            # A-02: Dashboard
│   │   ├── questions/
│   │   │   ├── QuestionList.tsx     # A-04: Soru listesi
│   │   │   ├── QuestionCreate.tsx   # A-03: Soru oluşturma (drag-drop cevap)
│   │   │   ├── QuestionEdit.tsx     # Soru düzenleme
│   │   │   └── QuestionCalendar.tsx # A-05: Takvim görünümü
│   │   ├── entities/
│   │   │   ├── EntityList.tsx       # A-06: Entity listesi
│   │   │   └── EntityForm.tsx       # Ekleme / düzenleme formu
│   │   ├── users/
│   │   │   ├── UserList.tsx         # A-07: Kullanıcı listesi
│   │   │   └── UserDetail.tsx       # Kullanıcı detay modalı
│   │   ├── events/
│   │   │   └── EventList.tsx        # A-09: Özel etkinlik yönetimi
│   │   ├── stats/
│   │   │   └── StatsPage.tsx        # A-08: İstatistikler
│   │   └── settings/
│   │       └── SettingsPage.tsx     # A-10: App config + admin kullanıcı yönetimi
│   │
│   └── components/
│       ├── layout/
│       │   ├── AdminLayout.tsx      # Sidebar + içerik alanı wrapper
│       │   ├── Sidebar.tsx          # Sol menü, aktif route vurgusu, rol bazlı menü
│       │   └── Header.tsx           # Sayfa başlığı + bildirim
│       ├── ui/                      # shadcn/ui bileşenleri (Button, Table, Dialog vb.)
│       ├── questions/
│       │   ├── AnswerDragList.tsx   # Sürükle-bırak cevap listesi (@dnd-kit/core)
│       │   ├── AnswerRow.tsx        # Tek cevap satırı (rank, entity, stat, sil)
│       │   └── EntitySearch.tsx     # Cevap arama + inline entity ekleme modal
│       ├── entities/
│       │   └── DuplicateWarning.tsx # Çift kayıt uyarı bileşeni
│       ├── dashboard/
│       │   ├── PoolHealthWidget.tsx # Havuz sağlığı uyarı widget'ı
│       │   ├── StatCard.tsx         # DAU, MAU vb. metrik kartı
│       │   └── QuestionTable.tsx    # Aktif sorular tablosu
│       └── users/
│           ├── UserDetailModal.tsx  # Kullanıcı detay + şüpheli oturumlar
│           └── BanModal.tsx         # Ban / ban öner onay dialog'u
│
├── public/
│   └── favicon.ico
│
├── .env                             # GIT'E EKLENMEMELİ
├── .env.example
├── .gitignore
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## ORTAM DEĞİŞKENLERİ (.env.example)

### Backend `.env.example`

```env
# Veritabanı
DATABASE_URL=postgresql://user:password@host:5432/football_challenge

# Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Supabase
SUPABASE_URL=https://....supabase.co
SUPABASE_SERVICE_KEY=...
SUPABASE_STORAGE_BUCKET=entity-images

# JWT
JWT_ACCESS_SECRET=en-az-32-karakter-rastgele-deger
JWT_REFRESH_SECRET=en-az-32-karakter-farkli-deger
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Admin Session
ADMIN_SESSION_SECRET=en-az-32-karakter-rastgele-deger

# Uygulama
NODE_ENV=development
PORT=3000
APP_BASE_URL=https://api.footballchallenge.app

# CDN / Storage
STORAGE_CDN_BASE_URL=https://....supabase.co/storage/v1/object/public/entity-images
```

### Mobile `.env.example`

```env
API_BASE_URL=https://api.footballchallenge.app/api/v1
ADMOB_APP_ID_ANDROID=ca-app-pub-...
ADMOB_APP_ID_IOS=ca-app-pub-...
ADMOB_REWARDED_AD_UNIT_ANDROID=ca-app-pub-...
ADMOB_REWARDED_AD_UNIT_IOS=ca-app-pub-...
```

### Admin `.env.example`

```env
VITE_API_BASE_URL=https://api.footballchallenge.app/api
```

---

## GIT'E EKLENMEYECEKLERİN ÖZETI

```
# Her projede
.env
node_modules/

# Backend
dist/

# Flutter
build/
.dart_tool/
*.iml
ios/Flutter/Flutter.framework
android/app/google-services.json
ios/Runner/GoogleService-Info.plist
ios/Runner/GoogleService-Info.plist

# Admin
dist/
```

---

## ÖNEMLİ NOTLAR

1. `shared/` klasöründeki tip tanımları hem backend hem admin tarafından import edilir. Mobile Flutter proje olduğu için paylaşım yapılmaz; aynı tipler `mobile/lib/features/*/domain/` içinde ayrıca tanımlanır.

2. `prisma/migrations/` klasörü git'e commit edilir. Migration'lar doğrudan SQL ile yapılmaz.

3. `pubspec.lock` git'e commit edilir (Flutter standart pratiği).

4. Her `.env.example` dosyası her değişken için açıklama satırı içerir.

5. `mobile/assets/avatars/` klasöründe 20-30 adet futbol temalı avatar PNG dosyası bulunmalıdır. Bunlar uygulama boyutunu artırmamak için optimize edilmiş (maks. 50KB/adet) olmalıdır.

6. `mobile/assets/animations/confetti.json` Lottie animasyon dosyasıdır. Yüksek puan (tam doğru veya %100 üzeri) durumunda result ekranında oynatılır.

---

*Bu dosya projenin gerçek dosya ağacı referansıdır. Yeni dosya veya klasör eklenmeden önce bu dosya güncellenir.*
