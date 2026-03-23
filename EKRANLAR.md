# FOOTBALL CHALLENGE — EKRAN TASARIMLARI VE UI DETAYLARI

> Bu dosya uygulamadaki her ekranın ve admin panelinin tam görsel tasarım referansıdır.
> Gemini bu dosyayı okuyarak Flutter widget'larını ve admin UI bileşenlerini buna göre inşa eder.
> ASCII çizimlerdeki her eleman, gerçek implementasyonda birebir karşılık bulmalıdır.

---

## MOBİL UYGULAMA — EKRAN KATALOĞU

---

### E-01: SPLASH EKRANI

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                                                 │
│                                                 │
│                    ⚽                           │
│                                                 │
│           FOOTBALL CHALLENGE                    │
│                                                 │
│                                                 │
│            ████████░░░░░░░░                    │
│           Yükleniyor...                        │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Detaylar:**
- Arkaplan: koyu lacivert (`#0F172A`)
- Logo animasyonu: ⚽ yukarıdan aşağı düşer, bounce ile durur
- Progress bar: mavi dolum animasyonu
- Uygulama açılışında `/api/v1/app/config` çağrısı burada yapılır
- Force update gerekiyorsa bu ekrandan `E-02b`'ye yönlendirilir
- Kullanıcı oturumu varsa `E-06`'ya, yoksa `E-03`'e yönlendirilir

---

### E-02: ONBOARDING (3 Sayfa — Yalnızca İlk Kurulumda)

**Sayfa 1:**
```
┌─────────────────────────────────────────────────┐
│                                          1/3    │
│                                                 │
│                    🏆                           │
│                                                 │
│         Futbol Bilgini Test Et                  │
│                                                 │
│   Her gün yeni sorular, istatistikler ve        │
│   kategoriler seni bekliyor.                    │
│                                                 │
│                                                 │
│   ●  ○  ○                    [İleri →]         │
└─────────────────────────────────────────────────┘
```

**Sayfa 2:**
```
┌─────────────────────────────────────────────────┐
│                                          2/3    │
│                                                 │
│                    ⏱️                           │
│                                                 │
│         Süreye Karşı Oyna                       │
│                                                 │
│   Zamana karşı yarış, ne kadar çok              │
│   doğru bilirsen o kadar çok puan al.           │
│                                                 │
│                                                 │
│   ○  ●  ○              [← Geri]  [İleri →]    │
└─────────────────────────────────────────────────┘
```

**Sayfa 3:**
```
┌─────────────────────────────────────────────────┐
│                                          3/3    │
│                                                 │
│                    📊                           │
│                                                 │
│         Sıralamada Yüksel                       │
│                                                 │
│   Türkiye ve dünya sıralamalarında              │
│   zirveye çık.                                 │
│                                                 │
│                                                 │
│   ○  ○  ●              [← Geri] [Başla 🎯]    │
└─────────────────────────────────────────────────┘
```

---

### E-02b: FORCE UPDATE EKRANI

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                    ⚠️                           │
│                                                 │
│         Güncelleme Gerekli                      │
│                                                 │
│   Uygulamanın bu sürümü artık                   │
│   desteklenmiyor. Devam etmek için              │
│   lütfen güncelleyin.                           │
│                                                 │
│   ┌─────────────────────────────────────┐      │
│   │      Mağazaya Git ve Güncelle       │      │
│   └─────────────────────────────────────┘      │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Detaylar:**
- Başka hiçbir etkileşime izin verilmez
- `force_update: true` geldiğinde gösterilir
- Buton App Store / Play Store'a yönlendirir

---

### E-03: GİRİŞ / KAYIT EKRANI

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                    ⚽                           │
│           FOOTBALL CHALLENGE                    │
│                                                 │
│   ┌─────────────────────────────────────────┐  │
│   │  🔵  Google ile Devam Et                │  │
│   └─────────────────────────────────────────┘  │
│                                                 │
│   ┌─────────────────────────────────────────┐  │
│   │  🍎  Apple ile Devam Et                 │  │
│   └─────────────────────────────────────────┘  │
│                                                 │
│   ─────────────── veya ───────────────         │
│                                                 │
│   ┌─────────────────────────────────────────┐  │
│   │  📧  E-posta ile Devam Et               │  │
│   └─────────────────────────────────────────┘  │
│                                                 │
│   Devam ederek Kullanım Koşulları'nı            │
│   ve Gizlilik Politikası'nı kabul               │
│   etmiş olursunuz.                             │
└─────────────────────────────────────────────────┘
```

**Detaylar:**
- Apple butonu iOS'ta zorunludur (App Store kuralı)
- Google butonu her iki platformda gösterilir
- E-posta seçilirse alt sheet açılır (kayıt/giriş formu)

**E-posta Alt Sheet:**
```
┌─────────────────────────────────────────────────┐
│  ─────── (drag handle)                          │
│                                                 │
│  E-posta                                        │
│  ┌─────────────────────────────────────────┐   │
│  │  ornek@mail.com                         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Şifre                                          │
│  ┌─────────────────────────────────────────┐   │
│  │  ••••••••••                        👁   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │           Giriş Yap / Kayıt Ol          │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### E-04: NİCKNAME SEÇİMİ (Sadece Yeni Kullanıcı)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Kullanıcı Adın Ne Olsun?                       │
│  Sıralamada bu isimle görüneceksin.             │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  FutbolGuru_42               ✓ Müsait   │   │
│  └─────────────────────────────────────────┘   │
│  Min 3, maks 20 karakter.                       │
│  Harf, rakam ve alt çizgi (_) kullanabilirsin.  │
│                                                 │
│  [Öneri: BalıkesirliFutbol] [Öneri: GoalHunter] │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │              Devam Et                   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Durum Göstergeleri:**
```
Yazılıyor:     │  FutbolGuru...              ⏳   │
Alınmış:       │  Ahmet                  ✗ Alınmış│
Geçersiz:      │  ab              ✗ En az 3 karakter│
Müsait:        │  FutbolGuru_42          ✓ Müsait  │
```

---

### E-05: ÜLKE + AVATAR SEÇİMİ (Sadece Yeni Kullanıcı)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Avatarını Seç                                  │
│                                                 │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐            │
│  │ 👤 │ │ 🧢 │ │ 🦅 │ │ 🐺 │ │ ⚡ │            │
│  └────┘ └────┘ └────┘ └────┘ └────┘            │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐            │
│  │ 🦁 │ │ 🔥 │ │ ⭐ │ │🏆  │ │ 🎯 │            │
│  └────┘ └────┘ └────┘ └────┘ └────┘            │
│  (Seçili avatar mavi çerçeveli gösterilir)      │
│                                                 │
│  ──────────────────────────────────────────     │
│                                                 │
│  Ülken                                          │
│  ┌─────────────────────────────────────────┐   │
│  │  🇹🇷  Türkiye                        ▼  │   │
│  └─────────────────────────────────────────┘   │
│  (Telefon diline göre otomatik seçilir)         │
│                                                 │
│  Seni kim davet etti? (opsiyonel)               │
│  ┌─────────────────────────────────────────┐   │
│  │  Davet kodu gir...                      │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │          Hadi Başlayalım! 🎯            │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

### E-06: ANA EKRAN (HOME)

```
┌─────────────────────────────────────────────────┐
│  ⚽ Football Challenge          🔔  [👤 AhmetFC] │
│  🇹🇷 #142  |  🌍 #8.431  |  ⭐ 2.840 puan      │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  🌍  DÜNYA KUPASI 2026         AKTİF 🔴 │   │
│  │  "WC tarihinin en golcü 5 oyuncusu"    │   │
│  │  ⭐⭐⭐ ZOR  |  ⏱ 45sn  |  5 cevap     │   │
│  │  ┌─────────────────────────────────┐   │   │
│  │  │         HEMEN OYNA             │   │   │
│  │  └─────────────────────────────────┘   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  BUGÜNKÜ MODÜLLER                               │
│                                                 │
│  ┌──────────────────┐  ┌──────────────────┐    │
│  │  ⚽               │  │  🏟️              │    │
│  │  Oyuncular        │  │  Kulüpler         │    │
│  │  ⭐⭐☆ Orta       │  │  ⭐☆☆ Kolay      │    │
│  │  60sn • 7 cevap  │  │  90sn • 5 cevap  │    │
│  │  [ OYNA ]         │  │  [ OYNA ]         │    │
│  └──────────────────┘  └──────────────────┘    │
│                                                 │
│  ┌──────────────────┐  ┌──────────────────┐    │
│  │  🌍               │  │  👔              │    │
│  │  Milli Takımlar   │  │  Teknik Direktör │    │
│  │  ⭐⭐⭐ Zor        │  │  ✅ TAMAMLANDI   │    │
│  │  45sn • 3 cevap  │  │  247 puan        │    │
│  │  [ OYNA ]         │  │  [  SONUÇ  ]     │    │
│  └──────────────────┘  └──────────────────┘    │
│                                                 │
│  📢 Reklam izleyerek ekstra soru kazanabilirsin │
│  ──────────────────────────────────────────     │
│                                                 │
├──────┬──────────┬──────────┬──────────┬─────────┤
│  🏠  │    🏆    │    📅    │    📊    │    👤   │
│  Ana │ Sıralama │  Takvim  │ İstatist.│  Profil │
└──────┴──────────┴──────────┴──────────┴─────────┘
```

**Kart Durumları:**
```
Normal (oynanmamış):
┌──────────────────┐
│  ⚽               │
│  Oyuncular        │
│  ⭐⭐☆ Orta       │
│  60sn • 7 cevap  │
│  [ OYNA ]         │
└──────────────────┘

Tamamlandı:
┌──────────────────┐
│  ✅ ⚽            │
│  Oyuncular        │
│  6/7 doğru       │
│  247 puan        │
│  [  SONUÇ  ]     │
└──────────────────┘

Hak bitti (reklam ile devam):
┌──────────────────┐
│  🔒 ⚽            │
│  Oyuncular        │
│  Günlük hakkın   │
│  doldu           │
│  [📺 Reklam İzle]│
└──────────────────┘
```

---

### E-07: MODÜL DETAY / CHALLENGE TANITIM EKRANI

```
┌─────────────────────────────────────────────────┐
│  ←                                              │
│                                                 │
│              ⚽  OYUNCULAR                      │
│                                                 │
│        BUGÜNÜN CHALLENGE'I                      │
│                                                 │
│   ┌─────────────────────────────────────────┐  │
│   │  Zorluk        ⭐⭐☆  Orta             │  │
│   ├─────────────────────────────────────────┤  │
│   │  Süre          ⏱  60 saniye            │  │
│   ├─────────────────────────────────────────┤  │
│   │  Cevap Sayısı  🎯  7 futbolcu           │  │
│   ├─────────────────────────────────────────┤  │
│   │  Kategori      🏆  La Liga              │  │
│   └─────────────────────────────────────────┘  │
│                                                 │
│   ⚠️  Soruyu başlatınca süre işlemeye başlar.  │
│      Uygulamayı kapatsan bile süre akar.        │
│                                                 │
│   ┌─────────────────────────────────────────┐  │
│   │           ▶  BAŞLA                      │  │
│   └─────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Detaylar:**
- Soru başlığı bu ekranda gösterilmez (hile önleme)
- "Başla" basılınca sunucuya `POST /sessions/:id/start` gönderilir
- Sunucu `started_at` kaydeder, client sayacı başlatır

---

### E-08: OYUN EKRANI

```
┌─────────────────────────────────────────────────┐
│  ✕                                     0:47  ⏱ │
│  ━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░            │
│  (mavi progress bar, soldan sağa azalır)        │
├─────────────────────────────────────────────────┤
│                                                 │
│  La Liga'da 2000 sonrası en fazla asist         │
│  yapan 7 futbolcuyu bul                         │
│                                                 │
│  ⚽ Oyuncu  ·  ⭐⭐☆ Orta  ·  7 cevap          │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  🔍  Futbolcu ara...                            │
│  ┌─────────────────────────────────────────┐   │
│  │  mes                                    │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  🇦🇷  Lionel Messi          FC Barcelona │   │
│  │  🇩🇪  Mesut Özil              Arsenal    │   │
│  │  🇧🇷  Fernandinho             Man City   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
├─────────────────────────────────────────────────┤
│  Seçtiklerin (3/7):                             │
│                                                 │
│  ┌───────────────────────┐ ┌─────────────────┐  │
│  │ 🇦🇷 Lionel Messi   ✕ │ │ 🇪🇸 Xavi H.  ✕ │  │
│  └───────────────────────┘ └─────────────────┘  │
│  ┌───────────────────────┐                      │
│  │ 🇧🇷 Ronaldinho     ✕ │                      │
│  └───────────────────────┘                      │
│                                                 │
│  ▢  ▢  ▢  ▢   (boş slotlar)                   │
│                                                 │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐   │
│  │          ✓  BİTİR VE SONUCU GÖR        │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Süre Sayacı Renk Durumları:**
```
60s → 11s : Mavi/Beyaz  ─ normal
10s →  4s : Sarı        ─ hafif titreşim (vibration)
 3s →  0s : Kırmızı     ─ hızlı titreşim + sayaç sesi
```

**"Bitir" Butonu Durumları:**
```
0 cevap girildi:
│  ─────────────── (pasif, gri)

1+ cevap girildi:
│  ✓  BİTİR VE SONUCU GÖR  (aktif, mavi)

Tüm slotlar doldu:
│  🎯 BİTİR VE SÜRE BONUSU KAZAN  (aktif, yeşil vurgu)
```

**Autocomplete Kuralları:**
- Min 2 harf → tetiklenir
- Maks 6 sonuç
- Her sonuç: bayrak + isim + (varsa kulüp)
- Zaten seçilenler listeden çıkar
- Boş sonuç: "Sonuç bulunamadı"

---

### E-09: SONUÇ EKRANI

```
┌─────────────────────────────────────────────────┐
│                   SONUÇ                         │
│                5 / 7 Doğru                      │
│                                                 │
│          ┌─────────────────────┐                │
│          │   🏆    247         │  ← sayma       │
│          │         puan        │    animasyonu   │
│          └─────────────────────┘                │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  1.  ✅  Lionel Messi          192 asist        │
│  2.  ✅  Xavi Hernandez        151 asist        │
│  3.  ✅  David Silva           103 asist        │
│  4.  ✅  Andres Iniesta         98 asist        │
│  5.  🔵  ▓▓▓▓▓▓ ▓▓▓▓▓▓▓▓      ?? asist        │
│  6.  ✅  David Villa            81 asist        │
│  7.  🔵  ▓▓▓▓▓▓ ▓▓▓▓▓▓         ?? asist        │
│                                                 │
├─────────────────────────────────────────────────┤
│  Yanlış girdiğin:                               │
│  ❌  Ronaldinho      (bu listede değil)         │
│  ❌  Neymar Jr.      (bu listede değil)         │
│                                                 │
├─────────────────────────────────────────────────┤
│  Sıralamadaki yerin:                            │
│  🇹🇷 #142 → #139  (+3 ▲)                        │
│  🌍 #8.431 → #8.219  (+212 ▲)                   │
│                          (1-2 sn sonra yüklenir)│
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  📺  Reklam İzle → 247 × 1.5 = 370 puan│   │
│  └─────────────────────────────────────────┘   │
│  (Reklam yoksa: buton pasif "Reklam Yok" gri)  │
│                                                 │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  │
│  │  Paylaş  │  │ Sıralamaya   │  │  Ana     │  │
│  │   🔗     │  │    Git 🏆    │  │ Ekran 🏠 │  │
│  └──────────┘  └──────────────┘  └──────────┘  │
└─────────────────────────────────────────────────┘
```

**Reklam İzlendikten Sonra:**
```
├─────────────────────────────────────────────────┤
│  ✅  Reklam bonusu uygulandı!                   │
│                                                 │
│          ┌─────────────────────┐                │
│          │   🏆    370         │  ← güncellendi │
│          │         puan        │                │
│          └─────────────────────┘                │
│                                                 │
│  🇹🇷 #142 → #131  (+11 ▲)   [güncellendi]      │
```

**Blur Tasarım Notu:**
- `▓▓▓▓▓▓` blur overlay: frosted glass efekti (Flutter'da `BackdropFilter` + `ImageFilter.blur`)
- Premium kullanıcıda `▓▓▓▓▓▓` yok, gerçek isim gösterilir
- Yanlış giriş yanında sıra bilgisi kesinlikle gösterilmez

---

### E-10: LEADERBOARD EKRANI

```
┌─────────────────────────────────────────────────┐
│  SIRALAMAÄ                                       │
│                                                 │
│  ┌──────┬──────────┬────────┬────────┬────────┐ │
│  │ Genel│ Oyuncular│Kulüpler│Milli T.│ Teknik │ │
│  └──────┴──────────┴────────┴────────┴────────┘ │
│  (yatay kaydırılabilir sekme)                   │
│                                                 │
│  ┌────────────┬─────────────┬───────────────┐   │
│  │ 🇹🇷 Türkiye│ 🌍 Global  │               │   │
│  └────────────┴─────────────┴───────────────┘   │
│                                                 │
│  ┌──────────────┬────────────┬────────────────┐  │
│  │ Tüm Zamanlar │  Bu Ay     │  Bu Hafta     │  │
│  └──────────────┴────────────┴────────────────┘  │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  🥇  1   FutbolGuru_99          12.840 puan    │
│  🥈  2   MadridAşkı             11.200 puan    │
│  🥉  3   BarçaFanatik           10.990 puan    │
│       4   PremierKral             9.450 puan    │
│       5   SerieAEfsane            8.200 puan    │
│       6   BundesligaFan           7.800 puan    │
│       7   WCLegend                7.550 puan    │
│       8   LaLigaKral              7.200 puan    │
│       9   ChampionsAce            6.900 puan    │
│      10   GoalMachine             6.500 puan    │
│                                                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                 │
│  📍 142   AhmetFC (sen)          2.840 puan    │
│           (sabit, her zaman en altta görünür)   │
│                                                 │
│  Toplam 4.821 oyuncu                           │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Özel Etkinlik Sıralaması (Aktif Etkinlik Varsa):**
```
│  🌍  DÜNYA KUPASI 2026 SIRALAMA               │
│  ┌─────────────────────────────────────────┐  │
│  │  1   WCMaster              1.240 puan   │  │
│  │  2   FutbolGuru_99           980 puan   │  │
│  │  ...                                    │  │
│  │  📍 42   AhmetFC (sen)       320 puan  │  │
│  └─────────────────────────────────────────┘  │
```

---

### E-11: PROFİL EKRANI

```
┌─────────────────────────────────────────────────┐
│  ← PROFİL                              ⚙️ Ayar │
│                                                 │
│         ┌───────────────────────────────┐       │
│         │  [🦁]  AhmetFC               │       │
│         │  🇹🇷 Türkiye · Üye: 3 ay     │       │
│         └───────────────────────────────┘       │
│                                                 │
│  📊 GENEL İSTATİSTİKLER                         │
│  ┌─────────┬─────────┬─────────┬─────────┐     │
│  │  2.840  │   47    │  78%    │  60.4   │     │
│  │  Toplam │ Çözülen │ Doğruluk│  Ort.   │     │
│  │  Puan   │  Soru   │  Oranı  │  Puan   │     │
│  └─────────┴─────────┴─────────┴─────────┘     │
│                                                 │
│  🏅 ROZETLER                                    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                   │
│  │ 🔥 │ │ ⭐ │ │ 🎯 │ │ 🌍 │                   │
│  │7gün│ │10s │ │Mük.│ │ WC │                   │
│  └────┘ └────┘ └────┘ └────┘                   │
│                                                 │
│  📈 MODÜL BAZLI SIRALAMA                        │
│  Genel    🇹🇷 #142      🌍 #8.431               │
│  Oyuncular    🇹🇷 #98                            │
│  Kulüpler     🇹🇷 #201                           │
│  Milli T.     🇹🇷 #412                           │
│  Teknik D.    🇹🇷 #890                           │
│                                                 │
│  🕐 GEÇMIŞ DÖNEM SIRALAMALARIM                  │
│  2025-Q1   🇹🇷 #89   🌍 #3.241                  │
│  2024-Q4   🇹🇷 #201  🌍 #8.109                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### E-12: AYARLAR EKRANI

```
┌─────────────────────────────────────────────────┐
│  ← AYARLAR                                      │
│                                                 │
│  HESAP                                          │
│  ┌─────────────────────────────────────────┐   │
│  │  👤  Kullanıcı Adı Değiştir       →     │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │  🌍  Ülke Değiştir (🇹🇷 Türkiye)  →     │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │  🖼  Avatar Değiştir               →     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ABONELIK                                       │
│  ┌─────────────────────────────────────────┐   │
│  │  👑  Premium'a Geç                →     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  UYGULAMA                                       │
│  ┌─────────────────────────────────────────┐   │
│  │  📋  Kullanım Koşulları            →     │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │  🔒  Gizlilik Politikası           →     │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │  📧  Destek                        →     │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │  v1.0.0                                 │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  🚪  Çıkış Yap                          │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  🗑️  Hesabımı Sil                       │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Nickname Değiştirme Alt Sheet:**
```
┌─────────────────────────────────────────────────┐
│  ─────── (drag handle)                          │
│  Kullanıcı Adı Değiştir                         │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  YeniNickname_42             ✓ Müsait   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │              Güncelle                   │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

### E-13: TAKVİM / ARŞİV EKRANI

```
┌─────────────────────────────────────────────────┐
│  ← TAKVİM                                       │
│                                                 │
│       HAZİRAN 2025                              │
│  Pzt  Sal  Çar  Per  Cum  Cmt  Paz              │
│                               1    2            │
│   3✅  4✅  5✅  6✅  7✅  8⬜  9⬜             │
│  10✅ 11✅ 12✅ 13⬜ 14⬜ 15⬜ 16⬜             │
│  17⬜ 18⬜ 19⬜ 20⬜ 21⬜ 22⬜ 23⬜             │
│                                                 │
│  ✅ = En az 1 soru çözüldü                      │
│  ⬜ = Soru çözülmedi                            │
│  Bugün: Çerçeveli                               │
│                                                 │
│  ─────────────────────────────────────────      │
│                                                 │
│  8 Haziran 2025                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  ⚽  Oyuncular  • Tamamlandı            │   │
│  │  6/7 doğru  •  247 puan                │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │  🏟️  Kulüpler  • Tamamlandı            │   │
│  │  5/5 doğru  •  184 puan  🏆 Mükemmel  │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │  🌍  Milli Takımlar  • Çözülmedi        │   │
│  │  0 puan                                 │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### E-14: BAN EKRANI

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                    🚫                           │
│                                                 │
│         Hesabınız Askıya Alındı                 │
│                                                 │
│   Football Challenge hesabınıza erişim          │
│   geçici olarak kısıtlanmıştır.                │
│                                                 │
│   Sorularınız için:                             │
│   destek@footballchallenge.app                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### E-15: İSTATİSTİK EKRANI

```
┌─────────────────────────────────────────────────┐
│  ← İSTATİSTİKLERİM                              │
│                                                 │
│  GENEL                                          │
│  ┌─────────────────────────────────────────┐   │
│  │  Toplam Çözülen Soru        47          │   │
│  │  Toplam Kazanılan Puan    2.840         │   │
│  │  Ortalama Puan/Soru        60.4         │   │
│  │  Genel Doğruluk Oranı      78%          │   │
│  │  En Yüksek Tek Soru Puanı  370          │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  MODÜL BAZLI                                    │
│  ┌─────────────────────────────────────────┐   │
│  │  ⚽ Oyuncular                            │   │
│  │  23 soru · 1.840 puan · %82 doğruluk   │   │
│  │  ████████████████░░░░                   │   │
│  ├─────────────────────────────────────────┤   │
│  │  🏟️ Kulüpler                            │   │
│  │  12 soru · 620 puan · %71 doğruluk     │   │
│  │  ██████████░░░░░░░░░░                   │   │
│  ├─────────────────────────────────────────┤   │
│  │  🌍 Milli Takımlar                      │   │
│  │  8 soru · 280 puan · %68 doğruluk      │   │
│  │  ████████░░░░░░░░░░░░                   │   │
│  ├─────────────────────────────────────────┤   │
│  │  👔 Teknik Direktörler                  │   │
│  │  4 soru · 100 puan · %55 doğruluk      │   │
│  │  █████░░░░░░░░░░░░░░░                   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  SON 7 GÜN                                      │
│  Pzt Sal Çar Per Cum Cmt Paz                    │
│   4   3   0   2   1   3   1  (çözülen soru)    │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ADMİN PANELİ — EKRAN KATALOĞU

> Admin paneli React web uygulamasıdır. Masaüstü önceliklidir.
> Sol tarafta sabit sidebar, sağda içerik alanı.

---

### A-01: ADMİN GİRİŞ EKRANI

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    ⚽ Football Challenge                         │
│                       Admin Paneli                             │
│                                                                 │
│              ┌───────────────────────────────────┐             │
│              │  E-posta                          │             │
│              │  admin@footballchallenge.app       │             │
│              ├───────────────────────────────────┤             │
│              │  Şifre                            │             │
│              │  ••••••••••••                 👁  │             │
│              ├───────────────────────────────────┤             │
│              │         Giriş Yap                 │             │
│              └───────────────────────────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### A-02: ADMİN DASHBOARD

```
┌──────────────┬──────────────────────────────────────────────────┐
│              │  Dashboard                          8 Haz 2025   │
│  ⚽ FC Admin │                                                   │
│  ──────────  │  BUGÜN                                           │
│              │  ┌──────────┬──────────┬──────────┬──────────┐  │
│  📊 Dashboard│  │  1.247   │   342    │  87%     │  4.2     │  │
│              │  │ Aktif    │ Çözülen  │ Tamam.   │ Ort Puan │  │
│  ❓ Sorular  │  │ Kullanıcı│ Oturum   │ Oranı    │ /Soru    │  │
│   └ Liste    │  └──────────┴──────────┴──────────┴──────────┘  │
│   └ Oluştur  │                                                   │
│   └ Takvim   │  SORU HAVUZU SAĞLIĞI                             │
│              │  ┌──────────────────────────────────────────┐   │
│  🗃 Entityler│  │  ⚽ Oyuncular    ████████████ 24 soru ✓  │   │
│   └ Oyuncu   │  │  🏟 Kulüpler    ████████░░░░ 12 soru ✓  │   │
│   └ Kulüp    │  │  🌍 Milli T.    █████░░░░░░░  7 soru ⚠️ │   │
│   └ Milli T. │  │  👔 Teknik D.   ███░░░░░░░░░  5 soru 🚨 │   │
│   └ Teknik D.│  └──────────────────────────────────────────┘   │
│              │  ⚠️ Milli Takımlar: 7 soru kaldı (~7 gün)       │
│  👥 Kullanıcı│  🚨 Teknik Dir.: 5 soru kaldı (~5 gün)         │
│              │                                                   │
│  🌟 Etkinlik │  BUGÜN AKTİF SORULAR                             │
│              │  ┌──────────┬────────┬────────┬──────┬────────┐ │
│  📈 İstatist.│  │ Soru     │ Modül  │ Çözülen│ Ort. │ Durum  │ │
│              │  ├──────────┼────────┼────────┼──────┼────────┤ │
│  🔧 Ayarlar  │  │ La Liga… │Oyuncu  │   89   │ 5.4  │ Aktif  │ │
│              │  │ Premier… │Kulüp   │   67   │ 4.1  │ Aktif  │ │
│  👤 SuperAdm │  │ WC 2026  │Özel    │  142   │ 7.2  │ Aktif  │ │
│              │  └──────────┴────────┴────────┴──────┴────────┘ │
│              │                                                   │
│              │  ŞÜPHELİ OTURUM (Bugün: 3 adet)                  │
│              │  [İncele →]                                       │
│              │                                                   │
└──────────────┴──────────────────────────────────────────────────┘
```

---

### A-03: SORU OLUŞTURMA EKRANI

```
┌──────────────┬──────────────────────────────────────────────────┐
│  [Sidebar]   │  Yeni Soru Oluştur                               │
│              │                                                   │
│              │  TEMEL BİLGİLER                                  │
│              │  ┌────────────────────────────────────────────┐  │
│              │  │ Başlık                                      │  │
│              │  │ La Liga'da 2000 sonrası en fazla asist…    │  │
│              │  └────────────────────────────────────────────┘  │
│              │                                                   │
│              │  ┌────────────────┐  ┌────────────────────────┐  │
│              │  │ Modül          │  │ Kategori               │  │
│              │  │ [⚽ Oyuncu  ▼] │  │ [La Liga            ▼] │  │
│              │  └────────────────┘  └────────────────────────┘  │
│              │                                                   │
│              │  ┌──────────────┐ ┌──────────┐ ┌─────────────┐  │
│              │  │ Zorluk       │ │ Süre (sn)│ │ Baz Puan    │  │
│              │  │ [Orta ⭐⭐☆▼]│ │ [  60   ]│ │ [   100   ] │  │
│              │  └──────────────┘ └──────────┘ └─────────────┘  │
│              │                                                   │
│              │  ┌─────────────────────────────────────────────┐ │
│              │  │ Yayın Tarihi                                 │ │
│              │  │ ○ Hemen Yayınla   ● Tarihe Programla        │ │
│              │  │                   [ 2025-06-15           📅 ]│ │
│              │  └─────────────────────────────────────────────┘ │
│              │                                                   │
│              │  CEVAPLAR (Rank 1 = en kolay, son = en zor)     │
│              │  ┌─────────────────────────────────────────────┐ │
│              │  │ Futbolcu ara ve ekle...               [🔍] │ │
│              │  │                    [+ Yeni Entity Ekle   ] │ │
│              │  └─────────────────────────────────────────────┘ │
│              │                                                   │
│              │  ┌─────────────────────────────────────────────┐ │
│              │  │ ≡  Rank 1  🇦🇷 Lionel Messi   192  asist 🗑 │ │
│              │  │ ≡  Rank 2  🇪🇸 Xavi Hernandez 151  asist 🗑 │ │
│              │  │ ≡  Rank 3  🇪🇸 David Silva    103  asist 🗑 │ │
│              │  │ ≡  Rank 4  🇪🇸 A. Iniesta      98  asist 🗑 │ │
│              │  │ ≡  Rank 5  🇪🇸 Pedro           87  asist 🗑 │ │
│              │  │ ≡  Rank 6  🇪🇸 David Villa     81  asist 🗑 │ │
│              │  │ ≡  Rank 7  🇺🇾 Luis Suarez     79  asist 🗑 │ │
│              │  │            stat_display: "79 asist"         │ │
│              │  └─────────────────────────────────────────────┘ │
│              │                                                   │
│              │  ⚠️ stat_display boş bırakılırsa stat_value     │
│              │     kullanılır: "79 asist" formatında gösterilir │
│              │                                                   │
│              │  ┌───────────────┐  ┌───────────────────────┐   │
│              │  │ Taslak Kaydet │  │ 🚀 Yayınla / Programla│   │
│              │  └───────────────┘  └───────────────────────┘   │
└──────────────┴──────────────────────────────────────────────────┘
```

**Inline Entity Ekleme Modalı:**
```
┌─────────────────────────────────────────────┐
│  Hızlı Entity Ekle                     ✕   │
│                                             │
│  Tip:   [⚽ Oyuncu ▼]                       │
│  Ad:    [Adı girin...]                      │
│  Ülke:  [🇦🇷 Argentina ▼]                   │
│  Alias: [Messi, Leo, ...]  (virgülle ayır)  │
│                                             │
│  ⚠️ Bu isimde yakın kayıt bulundu:          │
│  "Lionel Messi" — aynı entity mi?           │
│                                             │
│  [İptal]        [Entity'yi Ekle]            │
└─────────────────────────────────────────────┘
```

---

### A-04: SORU LİSTESİ EKRANI

```
┌──────────────┬──────────────────────────────────────────────────┐
│  [Sidebar]   │  Sorular                        [+ Yeni Soru]    │
│              │                                                   │
│              │  [⚽ Oyuncu ▼] [Tümü ▼] [Aktif ▼]  [Ara...]     │
│              │                                                   │
│              │  ┌──────┬──────────────┬───────┬──────┬───────┐  │
│              │  │Modül │ Başlık       │Zorluk │Durum │İşlem  │  │
│              │  ├──────┼──────────────┼───────┼──────┼───────┤  │
│              │  │ ⚽   │ La Liga asist│ ⭐⭐☆ │ Aktif│ ✏️ 🗑 │  │
│              │  │ 🏟   │ Premier Lig..│ ⭐☆☆ │ Aktif│ ✏️ 🗑 │  │
│              │  │ 🌍   │ WC 2026 gol. │ ⭐⭐⭐│Özel │ ✏️ 🗑 │  │
│              │  │ ⚽   │ Bundesliga…  │ ⭐⭐☆ │Tasl. │ ✏️ 🗑 │  │
│              │  │ 👔   │ Serie A hoca │ ⭐☆☆ │Arşiv │    🗑 │  │
│              │  └──────┴──────────────┴───────┴──────┴───────┘  │
│              │                                                   │
│              │  Sayfa 1 / 12    [← Önceki]  [Sonraki →]        │
└──────────────┴──────────────────────────────────────────────────┘
```

---

### A-05: SORU TAKVİMİ EKRANI

```
┌──────────────┬──────────────────────────────────────────────────┐
│  [Sidebar]   │  Soru Takvimi                    ← Haz  Tem →   │
│              │                                                   │
│              │  Temmuz 2025                                      │
│              │  Pzt    Sal    Çar    Per    Cum    Cmt    Paz   │
│              │                 1      2      3      4      5    │
│              │  [⚽🏟] [⚽🌍] [4MOD] [4MOD] [⚠️2] [⬜  ] [⬜ ]  │
│              │   6      7      8      9     10     11     12    │
│              │  [4MOD] [4MOD] [4MOD] [4MOD] [4MOD] [⬜  ] [⬜ ] │
│              │                                                   │
│              │  [⬜] = Soru atanmamış (kırmızı)                  │
│              │  [⚠️] = Eksik modül var (sarı)                    │
│              │  [4MOD] = 4 modül tamam (yeşil)                  │
│              │                                                   │
│              │  15 Temmuz ──────────────────────────────────    │
│              │  ⚽ Oyuncular : La Liga asist top 7 (Aktif)      │
│              │  🏟 Kulüpler  : Premier Lig top 5 (Aktif)       │
│              │  🌍 Milli T.  : [Soru Ata +]                    │
│              │  👔 Teknik D. : [Soru Ata +]                    │
│              │                                                   │
└──────────────┴──────────────────────────────────────────────────┘
```

---

### A-06: ENTİTY YÖNETİMİ EKRANI

```
┌──────────────┬──────────────────────────────────────────────────┐
│  [Sidebar]   │  Entity Yönetimi              [+ Yeni Entity]    │
│              │                                                   │
│              │  [⚽ Oyuncu ▼]  [Ara: isim veya alias...]        │
│              │                                                   │
│              │  ┌──────┬─────────────────┬──────┬────┬───────┐  │
│              │  │  Tip │ İsim            │ Ülke │Sor.│ İşlem │  │
│              │  ├──────┼─────────────────┼──────┼────┼───────┤  │
│              │  │  ⚽  │ Lionel Messi    │  🇦🇷  │  8 │ ✏️ 🗑 │  │
│              │  │  ⚽  │ Cristiano Ronaldo│ 🇵🇹  │  6 │ ✏️ 🗑 │  │
│              │  │  ⚽  │ Xavi Hernandez  │  🇪🇸  │  4 │ ✏️ 🗑 │  │
│              │  │  🏟  │ FC Barcelona    │  🇪🇸  │  3 │ ✏️ 🗑 │  │
│              │  └──────┴─────────────────┴──────┴────┴───────┘  │
│              │                                                   │
│              │  "Sor." = Kaç soruda cevap olarak kullanıldı     │
└──────────────┴──────────────────────────────────────────────────┘
```

**Entity Düzenleme Paneli (sağda açılır drawer):**
```
┌──────────────────────────────────────┐
│  Entity Düzenle                  ✕  │
│                                      │
│  Tip:     ⚽ Oyuncu                  │
│  Ad:      [Lionel Messi          ]   │
│  TR Adı:  [Lionel Messi          ]   │
│  Ülke:    [🇦🇷 Argentina ▼        ]   │
│  Alias:   [Messi, Leo, La Pulga   ]  │
│  Görsel:  [image_path/messi.jpg   ]  │
│           [Yeni Görsel Yükle      ]  │
│  Aktif:   [✓]                        │
│                                      │
│  Bu entity 8 soruda kullanılıyor.    │
│                                      │
│  [İptal]           [Kaydet]          │
└──────────────────────────────────────┘
```

---

### A-07: KULLANICI YÖNETİMİ EKRANI

```
┌──────────────┬──────────────────────────────────────────────────┐
│  [Sidebar]   │  Kullanıcı Yönetimi                              │
│              │                                                   │
│              │  [Nickname ara...]  [E-posta ara...]             │
│              │  [En Yüksek Puan ▼] [Tüm Ülkeler ▼] [Tümü ▼]   │
│              │                                                   │
│              │  ┌──────────┬──────────┬──────┬──────┬────────┐  │
│              │  │ Nickname │  E-posta │ Puan │ Ülke │ İşlem  │  │
│              │  ├──────────┼──────────┼──────┼──────┼────────┤  │
│              │  │ FutbolGr.│ f@m.com  │12.840│  🇹🇷  │ 👁 🔨  │  │
│              │  │ MadridAş.│ m@m.com  │11.200│  🇹🇷  │ 👁 🔨  │  │
│              │  │ ⚠️Hızlı  │ h@m.com  │ 9.990│  🇩🇪  │ 👁 🔨  │  │
│              │  └──────────┴──────────┴──────┴──────┴────────┘  │
│              │  ⚠️ = Şüpheli oturum flag'i var                  │
│              │                                                   │
│              │  Filtre: [Flaglılar] butonu ile sadece          │
│              │          şüpheli kullanıcılar listelenir         │
└──────────────┴──────────────────────────────────────────────────┘
```

**Kullanıcı Detay Modalı:**
```
┌─────────────────────────────────────────────────┐
│  Kullanıcı: AhmetFC                        ✕   │
│                                                 │
│  E-posta:   ahmet@mail.com                      │
│  Ülke:      🇹🇷 Türkiye                          │
│  Kayıt:     3 ay önce (2025-03-10)              │
│  Son Giriş: 2 saat önce                         │
│  Puan:      2.840                               │
│  Çözülen:   47 soru                             │
│  Premium:   Hayır                               │
│                                                 │
│  ŞÜPHELİ OTURUMLAR (2 adet)                     │
│  ┌─────────────────────────────────────────┐   │
│  │  2025-06-07 14:32  |  5sn  (min:28sn)  │   │
│  │  Neden: submitted too fast              │   │
│  │  2025-06-05 09:11  |  3sn  (min:20sn)  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [Moderatör: Ban Öner]  [Super Admin: Ban Et]   │
└─────────────────────────────────────────────────┘
```

---

### A-08: İSTATİSTİK EKRANI

```
┌──────────────┬──────────────────────────────────────────────────┐
│  [Sidebar]   │  İstatistikler          [Bugün ▼]  [Dışa Aktar] │
│              │                                                   │
│              │  KULLANICI METRİKLERİ                            │
│              │  ┌──────┬──────┬──────┬──────┬──────┬──────┐   │
│              │  │ DAU  │ MAU  │Toplam│ Yeni │Churn │Prem. │   │
│              │  │1.247 │8.341 │24.18 │  89  │ 4.2% │ 342  │   │
│              │  └──────┴──────┴──────┴──────┴──────┴──────┘   │
│              │  DAU/MAU = %14.9 (engagement)                   │
│              │                                                   │
│              │  SORU METRİKLERİ                                 │
│              │  ┌─────────────────┬──────┬──────┬──────┐       │
│              │  │ Soru            │Çözm. │ Doğr.│Abnd. │       │
│              │  ├─────────────────┼──────┼──────┼──────┤       │
│              │  │ La Liga asist   │  891 │ 62%  │  8%  │       │
│              │  │ WC 2026 golcü   │  442 │ 31%  │ 21%  │       │
│              │  │ Premier lig top │  678 │ 88%  │  3%  │       │
│              │  └─────────────────┴──────┴──────┴──────┘       │
│              │  En zor: WC 2026 golcü (%31 doğruluk)           │
│              │  En kolay: Premier lig top (%88 doğruluk)        │
│              │                                                   │
│              │  REKLAM VE PUAN                                  │
│              │  ┌────────────────────────────────────────────┐  │
│              │  │ Günlük Dağıtılan Toplam Puan:  48.921      │  │
│              │  │ Reklam Çarpımı Kullanım Oranı: %34         │  │
│              │  │ Soru Başına Ortalama Puan:       4.2       │  │
│              │  └────────────────────────────────────────────┘  │
│              │                                                   │
│              │  MODÜL AKTİFLİĞİ (bugün)                        │
│              │  ⚽ Oyuncular     ████████████░  891 çözüm      │
│              │  🏟 Kulüpler      ██████████░░░  678 çözüm      │
│              │  👔 Teknik D.     ████████░░░░░  542 çözüm      │
│              │  🌍 Milli T.      ██████░░░░░░░  412 çözüm      │
│              │                                                   │
└──────────────┴──────────────────────────────────────────────────┘
```

---

### A-09: ÖZEL ETKİNLİK YÖNETİMİ EKRANI

```
┌──────────────┬──────────────────────────────────────────────────┐
│  [Sidebar]   │  Özel Etkinlikler                [+ Yeni]        │
│              │                                                   │
│              │  AKTİF ETKİNLİK                                  │
│              │  ┌─────────────────────────────────────────────┐ │
│              │  │  🌍 Dünya Kupası 2026            🔴 AKTİF   │ │
│              │  │  11 Haz - 19 Tem 2025                       │ │
│              │  │  Toplam soru: 24  •  Çözülen: 4.821         │ │
│              │  │  [Soruları Gör]  [Düzenle]  [Deaktif Et]    │ │
│              │  └─────────────────────────────────────────────┘ │
│              │                                                   │
│              │  GEÇMİŞ ETKİNLİKLER                              │
│              │  ┌─────────────────────────────────────────────┐ │
│              │  │  🏆 UCL 2024/25 Finali       ⬜ KAPANDI    │ │
│              │  │  28 May 2025 • 8 soru • 2.341 çözüm        │ │
│              │  │  [Soruları Gör]  [Arşivle]                  │ │
│              │  └─────────────────────────────────────────────┘ │
│              │                                                   │
└──────────────┴──────────────────────────────────────────────────┘
```

---

### A-10: AYARLAR / APP CONFIG EKRANI

```
┌──────────────┬──────────────────────────────────────────────────┐
│  [Sidebar]   │  Uygulama Ayarları                               │
│              │                                                   │
│              │  VERSİYON YÖNETİMİ                               │
│              │  ┌─────────────────────────────────────────────┐ │
│              │  │  Minimum Versiyon   [ 1.0.0              ]  │ │
│              │  │  Son Versiyon       [ 1.2.0              ]  │ │
│              │  │  Force Update       [✓] Zorunlu güncelleme  │ │
│              │  └─────────────────────────────────────────────┘ │
│              │                                                   │
│              │  SUPER ADMİN — ADMİN KULLANICI YÖNETİMİ         │
│              │  ┌─────────────────────────────────────────────┐ │
│              │  │ E-posta          │  Rol          │  İşlem   │ │
│              │  ├──────────────────┼───────────────┼──────────┤ │
│              │  │ admin@fc.app     │ super_admin   │  (sen)   │ │
│              │  │ editor@fc.app    │ editor        │ ✏️ 🗑    │ │
│              │  │ mod@fc.app       │ moderator     │ ✏️ 🗑    │ │
│              │  └─────────────────────────────────────────────┘ │
│              │  [+ Yeni Admin Kullanıcı Ekle]                   │
│              │                                                   │
│              │  BEKLEYENLer (super_admin)                       │
│              │  ┌─────────────────────────────────────────────┐ │
│              │  │ Ban Önerileri: 2 adet         [İncele →]    │ │
│              │  └─────────────────────────────────────────────┘ │
│              │                                                   │
│              │                          [Değişiklikleri Kaydet] │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## GENEL UI KURALLARI (FLUTTER İMPLEMENTASYON NOTALARI)

### Renkler
| Token | Değer | Kullanım |
|---|---|---|
| `primary` | `#1A56DB` | Ana butonlar, başlıklar |
| `background` | `#0F172A` | Ana arkaplan (dark) |
| `surface` | `#1E293B` | Kart arkaplanı |
| `correct` | `#10B981` | Doğru cevap |
| `wrong` | `#EF4444` | Yanlış cevap |
| `blur` | `#94A3B8` | Blur overlay rengi |
| `warning` | `#F59E0B` | Süre uyarısı, sarı |
| `text_primary` | `#F8FAFC` | Ana metin |
| `text_secondary` | `#94A3B8` | İkincil metin |

### Animasyonlar
- Sayaç renk geçişi: `AnimatedContainer`, 500ms
- Puan sayma: `TweenAnimationBuilder`, 1200ms
- Autocomplete açılış: `AnimatedSize`, 150ms
- Sıralama yüklenme: `FadeTransition` ile lazy load
- Blur efekti: `BackdropFilter` + `ImageFilter.blur(sigmaX: 10, sigmaY: 10)`
- Kart basma: `GestureDetector` + `AnimatedScale` 0.97x, 100ms

### Bottom Navigation
- 5 sekme: Ana, Sıralama, Takvim, İstatistik, Profil
- Aktif sekme: `primary` renk ikon + etiket
- Pasif: `text_secondary` ikon + etiket
- `GoRouter` ile yönetilir, her sekme kendi navigator stack'ine sahip

### Hata Ekranı (Tüm Hata Durumları İçin)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│                   😕                            │
│                                                 │
│           Bir şeyler ters gitti                 │
│                                                 │
│   [Tekrar Dene]                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```
- Ağ hatası: "İnternet bağlantınızı kontrol edin"
- Sunucu hatası: "Bir şeyler ters gitti"
- Her ikisinde de "Tekrar Dene" butonu

---

*Bu dosya tüm ekran tasarımlarının referansıdır. Eklenecek yeni ekranlar önce buraya eklenir, sonra kodlanır.*
