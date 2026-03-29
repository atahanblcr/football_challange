// tests/auth/register-login.test.ts
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';

describe('Auth Module (Email)', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    nickname: 'test_user'
  };

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
  });

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/email/register')
      .send(testUser);

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data.accessToken).toBeDefined();
  });

  it('should not register with same email', async () => {
    const response = await request(app)
      .post('/api/v1/auth/email/register')
      .send(testUser);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('should login with correct credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/email/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeDefined();
  });

  it('should not login with wrong password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/email/login')
      .send({
        email: testUser.email,
        password: 'wrong-password'
      });

    expect(response.status).toBe(401);
  });
});
