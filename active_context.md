# AKTİF ÇALIŞMA BAĞLAMI (ACTIVE CONTEXT)

**Şu Anki Faz:** Proje Tamamlandı (Final Release Ready)
**Şu Anki Görev:** Devir ve Final Kontrol

## Mevcut Odak Noktası
- **İçerik:** 242+ gerçek futbol sorusu (Players, Clubs, Nationals, Managers) veritabanına yüklendi.
- **FCM Entegrasyonu:** Backend (firebase-admin) ve Mobil (firebase_messaging) uçtan uca bağlandı. fcmToken senkronizasyonu aktif.
- **AdMob Entegrasyonu:** AdService ve AdRewardButtonWidget ile gerçek reklam akışı kuruldu.
- **Pazarlama:** Store metadataları ve görsel taslakları (MARKETING.md) hazırlandı.

## Son Yapılan İşlemler
- **Seeding:** Dev veri seti (1202+ cevap) prisma/content_seed.ts ile aktarıldı.
- **Notification Service:** Backend'de NotificationService, Mobil'de NotificationService (FCM) implemente edildi.
- **Auth UX Fixes:** Register, Login ve Nickname ekranlarına min şifre uzunluğu (6), e-posta formatı ve geçersiz karakter kontrolleri eklendi. Hatalı girişlerde yönlendirme yerine SnackBar/errorText ile bilgilendirme sağlandı.
- **Profile Update:** User modeline fcmToken ve pushNotificationsEnabled alanları eklendi.

## Sıradaki Adımlar
1. Apple Store ve Play Store geliştirici hesaplarına yükleme.
2. FIREBASE_SERVICE_ACCOUNT_JSON ve ADMOB_ID'lerin canlı değerlerle güncellenmesi.
3. Soft launch ve kullanıcı geri bildirim döngüsü.

