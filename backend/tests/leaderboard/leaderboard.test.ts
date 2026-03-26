import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { jwtUtil } from '../../src/utils/jwt.util';
import { redis } from '../../src/config/redis';

describe('Leaderboard Integration Tests', () => {
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    // 1. Create a test user
    const user = await prisma.user.create({
      data: {
        nickname: 'lb_user',
        email: 'lb@example.com',
        authProvider: 'email',
        referralCode: 'LB123',
        countryCode: 'TR'
      }
    });
    userId = user.id;
    userToken = jwtUtil.generateAccessToken({ userId: user.id, role: 'user' });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } });
  });

  describe('GET /api/v1/leaderboard', () => {
    it('should return rankings from Redis', async () => {
      // Mock Redis zrevrange result
      (redis.zrevrange as jest.Mock).mockResolvedValue([
        userId, '1000',
        'another-user-id', '800'
      ]);

      const response = await request(app)
        .get('/api/v1/leaderboard?scope=global&period=alltime')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('nickname', 'lb_user');
      expect(response.body[0].score).toBe(1000);
      expect(response.body[1].nickname).toBe('Unknown');
    });
  });

  describe('GET /api/v1/leaderboard/me', () => {
    it('should return current user rank and score', async () => {
      (redis.zscore as jest.Mock).mockResolvedValue('1000');
      (redis.zrevrank as jest.Mock).mockResolvedValue(0); // 1st place
      (redis.zcard as jest.Mock).mockResolvedValue(100);

      const response = await request(app)
        .get('/api/v1/leaderboard/me?scope=global&period=alltime')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.rank).toBe(1);
      expect(response.body.score).toBe(1000);
      expect(response.body.totalParticipants).toBe(100);
    });

    it('should return null rank if user has no score', async () => {
      (redis.zscore as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/leaderboard/me?scope=global&period=alltime')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBe(null);
    });
  });
});
