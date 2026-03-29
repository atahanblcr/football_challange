// tests/setup.ts
import RedisMock from 'ioredis-mock';

// Redis'i global olarak mock'la. 
// Testler gerçek Upstash'e gitmek yerine bellekteki sahte Redis'i kullanacak.
jest.mock('../src/config/redis', () => {
  const redisInstance = new RedisMock();
  
  // Methodları jest mock'u haline getiriyoruz ki expect(...).toHaveBeenCalled() çalışabilsin
  redisInstance.get = jest.fn(redisInstance.get.bind(redisInstance)) as any;
  redisInstance.set = jest.fn(redisInstance.set.bind(redisInstance)) as any;
  redisInstance.incr = jest.fn(redisInstance.incr.bind(redisInstance)) as any;
  redisInstance.expire = jest.fn(redisInstance.expire.bind(redisInstance)) as any;
  redisInstance.zrevrange = jest.fn(redisInstance.zrevrange.bind(redisInstance)) as any;
  redisInstance.zscore = jest.fn(redisInstance.zscore.bind(redisInstance)) as any;
  redisInstance.zrevrank = jest.fn(redisInstance.zrevrank.bind(redisInstance)) as any;
  redisInstance.zcard = jest.fn(redisInstance.zcard.bind(redisInstance)) as any;
  redisInstance.zadd = jest.fn(redisInstance.zadd.bind(redisInstance)) as any;
  redisInstance.zrem = jest.fn(redisInstance.zrem.bind(redisInstance)) as any;
  
  return {
    redis: redisInstance
  };
});

afterAll(async () => {
  const { prisma } = require('../src/config/database');
  if (prisma && typeof prisma.$disconnect === 'function') {
    await prisma.$disconnect();
  }
});

// Bazı kütüphaneler (rate-limit-redis gibi) ioredis'i doğrudan import edebilir
jest.mock('ioredis', () => RedisMock);
