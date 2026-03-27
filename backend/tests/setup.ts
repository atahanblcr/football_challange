// tests/setup.ts
import RedisMock from 'ioredis-mock';

// Redis'i global olarak mock'la. 
// Testler gerçek Upstash'e gitmek yerine bellekteki sahte Redis'i kullanacak.
jest.mock('../src/config/redis', () => {
  const redisInstance = new RedisMock();
  return {
    redis: redisInstance
  };
});

// Bazı kütüphaneler (rate-limit-redis gibi) ioredis'i doğrudan import edebilir
jest.mock('ioredis', () => RedisMock);
