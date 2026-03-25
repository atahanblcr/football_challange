// tests/auth/token-refresh.test.ts
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { jwtUtil } from '../../src/utils/jwt.util';

describe('POST /api/v1/auth/refresh', () => {
  let refreshToken: string;
  let userId: string;

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'refresh-test@example.com' } });
    const user = await prisma.user.create({
      data: {
        email: 'refresh-test@example.com',
        nickname: 'refresh_tester',
        authProvider: 'email',
        referralCode: 'REF-123',
      }
    });
    userId = user.id;
    refreshToken = jwtUtil.generateRefreshToken({ userId: user.id });
  });

  it('should generate new tokens with valid refresh token', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();
  });

  it('should return 401 for invalid refresh token', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid-token' });

    expect(response.status).toBe(401);
  });

  it('should return 401 if user is banned', async () => {
    await prisma.user.update({ where: { id: userId }, data: { isBanned: true } });

    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(response.status).toBe(401);
  });
});
