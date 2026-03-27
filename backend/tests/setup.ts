// tests/setup.ts
import RedisMock from 'ioredis-mock';

// Redis'i global olarak mock'la. 
// Testler gerçek Upstash'e gitmek yerine bellekteki sahte Redis'i kullanacak.
jest.mock('../src/config/redis', () => {
  const redisInstance = new RedisMock();
  
  // Methodları jest mock'u haline getiriyoruz ki expect(...).toHaveBeenCalled() çalışabilsin
  redisInstance.get = jest.fn(redisInstance.get.bind(redisInstance));
  redisInstance.set = jest.fn(redisInstance.set.bind(redisInstance));
  redisInstance.incr = jest.fn(redisInstance.incr.bind(redisInstance));
  redisInstance.expire = jest.fn(redisInstance.expire.bind(redisInstance));
  
  return {
    redis: redisInstance
  };
});

// Bazı kütüphaneler (rate-limit-redis gibi) ioredis'i doğrudan import edebilir
jest.mock('ioredis', () => RedisMock);
