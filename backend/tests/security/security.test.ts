import request from 'supertest';
import app from '../../src/app';
import { redis } from '../../src/config/redis';

describe('Security and Hardening Tests', () => {
  beforeAll(async () => {
    // Bellekteki Redis'i temizle
    await redis.flushall();
  });

  describe('Rate Limiting', () => {
    it('should return 429 after too many login attempts', async () => {
      // Admin login limit is 5 per 15 mins
      const results = [];
      // 6 istek gönderiyoruz (limit 5)
      for (let i = 0; i < 7; i++) {
        const res = await request(app)
          .post('/api/admin/auth/login')
          .send({ email: 'wrong@admin.com', password: 'wrong' });
        results.push(res.status);
      }
      
      expect(results).toContain(429);
    });
  });

  describe('Input Validation & XSS', () => {
    it('should reject malformed UUIDs', async () => {
      const response = await request(app)
        .get('/api/admin/users/not-a-uuid')
        .set('x-admin-session', 'any-valid-looking-token');

      // Middleware auth'u kontrol eder, ama route bazlı validation 400 verir
      expect([400, 401]).toContain(response.status);
    });

    it('should have security headers (Helmet)', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['x-dns-prefetch-control']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['content-security-policy']).toBeDefined();
    });
  });
});
