// tests/auth/google-oauth.test.ts
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { OAuth2Client } from 'google-auth-library';

// Google OAuth mock
jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => {
      return {
        verifyIdToken: jest.fn().mockResolvedValue({
          getPayload: () => ({
            email: 'google-user@example.com',
            sub: 'google-sub-123',
          }),
        }),
      };
    }),
  };
});

describe('POST /api/v1/auth/google', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: 'google-user@example.com' } });
  });

  it('should register and login a new user via Google', async () => {
    const response = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 'mock-google-token' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.user.email).toBe('google-user@example.com');
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.isNewUser).toBe(true);
  });

  it('should login an existing user via Google', async () => {
    // Önce kullanıcıyı oluştur
    await prisma.user.create({
      data: {
        email: 'google-user@example.com',
        nickname: 'google_hero',
        authProvider: 'google',
        authProviderId: 'google-sub-123',
        referralCode: 'MOCK-123',
        nicknameChangedAt: new Date()
      }
    });

    const response = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 'mock-google-token' });

    expect(response.status).toBe(200);
    expect(response.body.data.isNewUser).toBe(false);
  });
});
