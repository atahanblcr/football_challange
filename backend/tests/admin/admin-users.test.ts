import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { jwtUtil } from '../../src/utils/jwt.util';

describe('Admin Users Integration Tests', () => {
  let adminToken: string;
  let adminId: string;
  let testUserId: string;

  beforeAll(async () => {
    const admin = await prisma.adminUser.create({
      data: {
        email: 'test_admin_u@example.com',
        passwordHash: 'hashed_pw',
        role: 'super_admin',
      }
    });
    adminId = admin.id;
    adminToken = jwtUtil.generateAdminSessionToken({ adminId: admin.id, role: 'super_admin' });

    const user = await prisma.user.create({
      data: {
        nickname: 'TEST_USER_ADMIN',
        email: 'test_admin_user@example.com',
        authProvider: 'email',
        referralCode: 'UADMIN1',
      }
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.adminUser.delete({ where: { id: adminId } });
  });

  describe('GET /api/admin/users', () => {
    it('should list users with filters', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('x-admin-session', adminToken)
        .query({ search: 'TEST_USER' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /api/admin/users/:id/ban', () => {
    it('should ban a user', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUserId}/ban`)
        .set('x-admin-session', adminToken)
        .send({ reason: 'Test ban reason' });

      expect(response.status).toBe(200);
      
      const user = await prisma.user.findUnique({ where: { id: testUserId } });
      expect(user?.isBanned).toBe(true);
    });
  });

  describe('POST /api/admin/users/:id/unban', () => {
    it('should unban a user', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUserId}/unban`)
        .set('x-admin-session', adminToken);

      expect(response.status).toBe(200);

      const user = await prisma.user.findUnique({ where: { id: testUserId } });
      expect(user?.isBanned).toBe(false);
    });
  });
});
