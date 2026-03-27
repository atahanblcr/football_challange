import { Redis } from 'ioredis';
import { env } from './env';

const isTest = env.NODE_ENV === 'test';

// Redis bağlantı ayarları
const redisOptions = {
  // Bağlantı koparsa veya testlerde yavaşsa bekletme süresi
  connectTimeout: 10000,
  maxRetriesPerRequest: isTest ? 3 : 20,
  retryStrategy: (times: number) => {
    if (isTest && times > 3) return null; // Testlerde çok fazla deneme yapma
    return Math.min(times * 50, 2000);
  }
};

export const redis = new Redis(env.UPSTASH_REDIS_REST_URL, redisOptions);

redis.on('connect', () => {
  if (!isTest) console.log('[Redis] Bağlantısı Başarılı');
});

redis.on('error', (err) => {
  if (!isTest) console.error('[Redis] Hatası:', err);
});
