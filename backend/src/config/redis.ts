// src/config/redis.ts
import { Redis } from 'ioredis';
import { env } from './env';

// Geliştirme ortamında UPSTASH_REDIS_REST_URL 'redis://' ile başlıyorsa ioredis kullanılır.
// Production'da Upstash HTTP API için upstash/redis paketi gerekebilir 
// ama şimdilik ioredis ile devam ediyoruz (Upstash Redis'i de destekler).

export const redis = new Redis(env.UPSTASH_REDIS_REST_URL);

redis.on('error', (err) => {
  console.error('Redis Bağlantı Hatası:', err);
});

redis.on('connect', () => {
  console.log('Redis Bağlantısı Başarılı');
});
