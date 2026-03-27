# AKTİF ÇALIŞMA BAĞLAMI (ACTIVE CONTEXT)

**Şu Anki Faz:** Faz 1 & 2 (İyileştirme ve Düzeltme)
**Şu Anki Görev:** Gemini Raporu Sonrası Kritik Düzeltmeler ve Test Stabilizasyonu

## Mevcut Odak Noktası
- Gemini raporunda belirtilen kritik veritabanı şeması ve iş mantığı hataları giderildi.
- Kodlar güncellendi ve GitHub'a pushlandı.
- **Kritik Durum:** Bazı testler (özellikle Redis mock ve Prisma bağlantı limitleri nedeniyle) şu an geçmiyor.

## Son Yapılan İşlemler
- **DB Şema Fix:** `DailyQuestionAssignment` unique constraint `[date, module, isExtra]` olarak güncellendi.
- **Scoring Fix:** `scoreBase` zorluk çarpanı öncesi `Math.floor` ile yuvarlanarak DB tutarlılığı sağlandı.
- **Hile Tespiti Fix:** 4 saniye kuralı `submittedAnswers.length` bazlı hale getirildi.
- **Kod Güncelleme:** `DailyQuestionAssignment`, `User`, `SpecialEvent` ve `AppConfig` modellerine eksik alanlar eklendi.
- **Git:** Değişiklikler repoya pushlandı.

## Geçmeyen / Eksik Testler (ACİL)
1.  **Rate Limit Testleri:** `redis.incr.mockResolvedValue` TypeError hatası veriyor. Redis mock yapısı testlerde tam oturtulmalı.
2.  **RBAC Middleware:** `adminUser` yerine `admin` property'si kullanıldığı için unit testleri fail ediyor.
3.  **Search Module:** Türkçe karakter "case-insensitive" (Büyük/Küçük harf) uyuşmazlığı nedeniyle Mesut Özil araması başarısız oluyor.
4.  **Prisma Connection Limit:** `MaxClientsInSessionMode` hatası nedeniyle `auth` ve `leaderboard` entegrasyon testleri toplu çalışınca patlıyor.

## Sıradaki Adımlar
1. Yukarıdaki geçmeyen testlerin tek tek ele alınıp düzeltilmesi.
2. Prisma bağlantı havuzunun (pooling) test ortamı için optimize edilmesi.
3. Tüm testler yeşil yandıktan sonra Faz 3 (Mobil) kurulumuna geçilmesi.
