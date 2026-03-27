import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { jwtUtil } from '../../src/utils/jwt.util';
import { bcryptUtil } from '../../src/utils/bcrypt.util';

describe('Admin Auth Integration Tests', () => {
  const adminEmail = 'super@admin.com';
  const adminPassword = 'Password123!';
  let adminId: string;

  beforeAll(async () => {
    const hashedPassword = await bcryptUtil.hash(adminPassword);
    const admin = await prisma.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'super_admin',
      }
    });
    adminId = admin.id;
  });

  afterAll(async () => {
    await prisma.adminUser.delete({ where: { id: adminId } });
  });

  describe('POST /api/admin/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/admin/auth/login')
        .send({ email: adminEmail, password: adminPassword });

      expect(response.status).toBe(200);
      expect(response.body.data.sessionToken).toBeDefined();
      expect(response.body.data.admin.email).toBe(adminEmail);
    });

    it('should return 401 with wrong password', async () => {
      const response = await request(app)
        .post('/api/admin/auth/login')
        .send({ email: adminEmail, password: 'wrong' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/auth/me', () => {
    it('should return current admin info with valid token', async () => {
      const token = jwtUtil.generateAdminSessionToken({ adminId, role: 'super_admin' });
      
      const response = await request(app)
        .get('/api/admin/auth/me')
        .set('x-admin-session', token);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(adminId);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/auth/me')
        .set('x-admin-session', 'invalid-token');

      expect(response.status).toBe(401);
    });
  });
});
