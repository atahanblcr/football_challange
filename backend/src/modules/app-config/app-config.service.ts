// src/modules/app-config/app-config.service.ts
import { prisma } from '../../config/database';

export const appConfigService = {
  getConfig: async () => {
    // 1. AppConfig kaydını çek
    let config = await prisma.appConfig.findFirst();
    
    // Eğer config yoksa varsayılanlarla oluştur (Migration sonrası ilk çalıştırma için)
    if (!config) {
      config = await prisma.appConfig.create({
        data: {
          id: 1,
          minimum_version: '1.0.0',
          latest_version: '1.0.0',
          force_update: false,
          adMultiplier: 1.5,
          difficultyMediumMultiplier: 1.25,
          difficultyHardMultiplier: 1.5,
          maxTimeBonus: 25,
        }
      });
    }

    // 2. Aktif etkinliği çek
    const activeEvent = await prisma.specialEvent.findFirst({
      where: { isActive: true },
      select: { id: true, name: true, endsAt: true }
    });

    // 3. Zaman bilgilerini hesapla (UTC+3 reset)
    const now = new Date();
    const server_time = now.toISOString();

    // Reset her gün 00:00 UTC+3 (Istanbul)
    const istanbulOffset = 3;
    const nextReset = new Date(now);
    nextReset.setUTCHours(24 - istanbulOffset, 0, 0, 0); // Bu bizi Istanbul 00:00'a götürür
    
    // Eğer hesaplanan reset geçmişteyse (bugün resetlendi), yarına at
    if (nextReset <= now) {
      nextReset.setUTCDate(nextReset.getUTCDate() + 1);
    }

    return {
      minimum_version: config.minimum_version,
      latest_version: config.latest_version,
      force_update: config.force_update,
      active_event: activeEvent || null,
      server_time,
      next_reset_at: nextReset.toISOString(),
      scoring: {
        adMultiplier: config.adMultiplier,
        difficultyMediumMultiplier: config.difficultyMediumMultiplier,
        difficultyHardMultiplier: config.difficultyHardMultiplier,
        maxTimeBonus: config.maxTimeBonus,
      }
    };
  }
};
