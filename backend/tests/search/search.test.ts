// tests/search/search.test.ts
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { jwtUtil } from '../../src/utils/jwt.util';
import { redis } from '../../src/config/redis';

describe('Search Module', () => {
  let accessToken: string;

  beforeAll(async () => {
    // 1. Test kullanıcısı oluştur
    await prisma.user.deleteMany({ where: { email: 'search-tester@example.com' } });
    const user = await prisma.user.create({
      data: {
        email: 'search-tester@example.com',
        nickname: 'search_tester',
        authProvider: 'email',
        referralCode: 'SEARCH-1',
      }
    });
    accessToken = jwtUtil.generateAccessToken({ userId: user.id });

    // 2. Test entity'leri oluştur
    await prisma.entity.deleteMany({ where: { name: { in: ['Lionel Messi', 'Mesut Özil', 'Arda Güler'] } } });
    await prisma.entity.createMany({
      data: [
        { name: 'Lionel Messi', type: 'player', alias: ['Messi', 'Leo'], isActive: true },
        { name: 'Mesut Özil', type: 'player', alias: ['Ozil'], isActive: true },
        { name: 'Arda Güler', type: 'player', alias: ['Guler'], isActive: true },
      ]
    });
  });

  describe('GET /api/v1/search', () => {
    it('should find entity by name', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ q: 'Messi', type: 'player' });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name).toBe('Lionel Messi');
    });

    it('should find entity with Turkish characters (case insensitive)', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ q: 'mesut', type: 'player' });

      expect(response.status).toBe(200);
      expect(response.body.data.some((e: any) => e.name === 'Mesut Özil')).toBe(true);
    });

    it('should find entity with normalized Turkish characters', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ q: 'ozil', type: 'player' });

      expect(response.status).toBe(200);
      expect(response.body.data.some((e: any) => e.name === 'Mesut Özil')).toBe(true);
    });

    it('should return 400 if q or type is missing', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ q: 'Messi' });

      expect(response.status).toBe(400);
    });

    it('should use cache for subsequent requests', async () => {
      await request(app)
        .get('/api/v1/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ q: 'Arda', type: 'player' });

      expect(redis.get).toHaveBeenCalled();
    });
  });
});
 
