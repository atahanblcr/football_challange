# AKTİF ÇALIŞMA BAĞLAMI (ACTIVE CONTEXT)

**Şu Anki Faz:** Android Stabilizasyon ve Canlı Ortam Hazırlığı
**Durum:** Tamamlandı

## Son Yapılan İşlemler
- **Android Build Modernizasyonu:**
    - Gradle dosyaları `.kts` formatına (Kotlin DSL) taşındı.
    - Gradle 8.12, AGP 8.9.1 ve Java 17 uyumluluğu sağlandı (Android 16 / SDK 36 desteği).
    - Eksik Android kaynakları (`strings.xml`, `styles.xml`, `mipmap` ikonları, `MainActivity.kt`) geri yüklendi.
    - Manifest çakışmaları (`AD_SERVICES_CONFIG`) `tools:replace` ile çözüldü.
- **Ağ ve Bağlantı Çözümleri:**
    - `ApiEndpoints.dart` güncellenerek MacBook'un yerel IP'si (`192.168.1.103`) üzerinden hem emülatör hem de fiziksel cihaz bağlantısı sağlandı.
- **Backend Otomasyonu:**
    - `dailyQuestionSelectorJob` geliştirilerek önümüzdeki 7 gün için otomatik soru atama özelliği eklendi ve manuel tetiklendi.
- **Admin Panel & UX:**
    - Soru düzenleme ekranındaki `400 Bad Request` hatası (boş stat değerleri) frontend doğrulaması ve kırmızı çerçeve geri bildirimiyle çözüldü.
- **Mobil UI/UX:**
    - Modül kartlarındaki terminoloji hatası ("Soru" -> "Cevap") düzeltildi.
    - `LoginScreen` ve `RegisterScreen` ekranlarındaki klavye açılınca oluşan taşma (overflow) sorunları `SingleChildScrollView` ile giderildi.

## Bir Sonraki Oturumda Yapılacaklar
1. **AdMob:** Gerçek reklam ID'lerinin entegrasyonu.
2. **Uygulama İkonu:** Geçici ikonların özgün tasarımla değiştirilmesi.
3. **Deployment:** Railway (Backend) ve Vercel (Admin) canlıya alma süreci.
