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

    return {
      minimum_version: config.minimum_version,
      latest_version: config.latest_version,
      force_update: config.force_update,
      active_event: activeEvent || null,
      scoring: {
        adMultiplier: config.adMultiplier,
        difficultyMediumMultiplier: config.difficultyMediumMultiplier,
        difficultyHardMultiplier: config.difficultyHardMultiplier,
        maxTimeBonus: config.maxTimeBonus,
      }
    };
  }
};
