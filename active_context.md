# AKTİF ÇALIŞMA BAĞLAMI (ACTIVE CONTEXT)

**Şu Anki Faz:** Faz 1 — Backend Core
**Şu Anki Görev:** 1.6 — Soru ve Oyun Oturumu

## Mevcut Odak Noktası
- Oyunun temel döngüsünün (`Start Session`, `Submit Answers`, `Get Result`) kodlanması.
- Sunucu taraflı puanlama motorunun (Bölüm 6 formülü) implementasyonu.
- Blur mantığı: Premium olmayan kullanıcılara cevapsız slotların gizli (blurred) gönderilmesi.
- Hile tespiti entegrasyonu.

## Son Yapılan İşlem
- Modül 1.5 Entity ve Arama Modülü başarıyla tamamlandı.
- Tüm sistem testleri (Auth, Users, Search, Middleware) geçildi (45/45).
- Redis ve FTS entegrasyonu doğrulandı.

## Sıradaki Adımlar
1. `src/modules/questions/` ve `src/modules/sessions/` servislerinin yazılması.
2. `src/modules/scoring/scoring.service.ts` (Puanlama Motoru) yazılması.
3. `tests/sessions/submit.test.ts` ile kapsamlı puanlama testleri.
