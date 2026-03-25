// tests/users/users.test.ts
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { jwtUtil } from '../../src/utils/jwt.util';

describe('Users Module', () => {
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    // Test kullanıcısı oluştur
    await prisma.user.deleteMany({ where: { email: 'user-test@example.com' } });
    await prisma.user.deleteMany({ where: { email: 'other@example.com' } });
    
    const user = await prisma.user.create({
      data: {
        email: 'user-test@example.com',
        nickname: 'original_nick',
        authProvider: 'email',
        referralCode: 'USER-123',
      }
    });
    userId = user.id;
    accessToken = jwtUtil.generateAccessToken({ userId: user.id });
  });

  describe('GET /api/v1/users/me', () => {
    it('should return user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.nickname).toBe('original_nick');
    });

    it('should return 401 if not authorized', async () => {
      const response = await request(app).get('/api/v1/users/me');
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    it('should update profile', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nickname: 'new_nick', avatarIndex: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data.nickname).toBe('new_nick');
      expect(response.body.data.avatarIndex).toBe(5);
    });

    it('should not update with taken nickname', async () => {
      // Başka bir kullanıcı oluştur
      await prisma.user.create({
        data: { email: 'other@example.com', nickname: 'taken_nick', authProvider: 'email', referralCode: 'OTHER-1' }
      });

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nickname: 'taken_nick' });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('NICKNAME_TAKEN');
    });
  });

  describe('GET /api/v1/users/check-nickname/:nickname', () => {
    it('should return available true for new nickname', async () => {
      const response = await request(app)
        .get('/api/v1/users/check-nickname/unused_nick');

      expect(response.status).toBe(200);
      expect(response.body.data.available).toBe(true);
    });

    it('should return available false for taken nickname', async () => {
      const response = await request(app)
        .get('/api/v1/users/check-nickname/taken_nick');

      expect(response.status).toBe(200);
      expect(response.body.data.available).toBe(false);
    });
  });
});
