// src/utils/redis-keys.util.ts

/**
 * Redis anahtar yönetimi için merkezi servis.
 * Leaderboard, Cache ve Auth blacklist anahtarları burada tanımlanır.
 */
export const redisKeys = {
  // Leaderboard
  leaderboard: (scope: string, period: string, module?: string) => {
    const base = `leaderboard:${scope}:${period}`;
    return module ? `${base}:${module}` : base;
  },

  // Autocomplete Cache
  autocomplete: (type: string, query: string) => {
    const prefix = query.slice(0, 3).toLowerCase();
    return `autocomplete:${type}:${prefix}`;
  },

  // Auth
  tokenBlacklist: (jti: string) => `blacklist:${jti}`,
  
  // Rate Limiting
  rateLimit: (ip: string, endpoint: string) => `ratelimit:${ip}:${endpoint}`,

  // App Config Cache
  appConfig: () => 'app:config'
};
