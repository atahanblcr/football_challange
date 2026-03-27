import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { jwtUtil } from '../../src/utils/jwt.util';
import { EntityType } from '@prisma/client';

describe('Admin Entities Integration Tests', () => {
  let adminToken: string;
  let adminId: string;

  beforeAll(async () => {
    const admin = await prisma.adminUser.create({
      data: {
        email: 'test_admin_e@example.com',
        passwordHash: 'hashed_pw',
        role: 'super_admin',
      }
    });
    adminId = admin.id;
    adminToken = jwtUtil.generateAdminSessionToken({ adminId: admin.id, role: 'super_admin' });
  });

  afterAll(async () => {
    await prisma.entity.deleteMany({ where: { name: { startsWith: 'TEST_ENTITY' } } });
    await prisma.adminUser.delete({ where: { id: adminId } });
  });

  describe('POST /api/admin/entities', () => {
    it('should create a new entity', async () => {
      const payload = {
        name: 'TEST_ENTITY_NEW',
        type: 'player',
        countryCode: 'TR',
        alias: ['Alias 1', 'Alias 2'],
      };

      const response = await request(app)
        .post('/api/admin/entities')
        .set('x-admin-session', adminToken)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe(payload.name);
      expect(response.body.data.type).toBe(payload.type);
    });
  });

  describe('GET /api/admin/entities/search', () => {
    it('should search entities by query', async () => {
      const response = await request(app)
        .get('/api/admin/entities/search')
        .set('x-admin-session', adminToken)
        .query({ q: 'TEST_ENTITY', type: 'player' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/admin/entities/check-duplicate', () => {
    it('should check for duplicate entity names', async () => {
      const response = await request(app)
        .get('/api/admin/entities/check-duplicate')
        .set('x-admin-session', adminToken)
        .query({ name: 'TEST_ENTITY_NEW' });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('DELETE /api/admin/entities/:id', () => {
    it('should delete an entity if not in use', async () => {
      const entity = await prisma.entity.findFirst({ where: { name: 'TEST_ENTITY_NEW' } });
      
      const response = await request(app)
        .delete(`/api/admin/entities/${entity?.id}`)
        .set('x-admin-session', adminToken);

      expect(response.status).toBe(200);

      const deleted = await prisma.entity.findUnique({ where: { id: entity?.id } });
      expect(deleted).toBeNull();
    });

    it('should return 400 if entity is used in questions', async () => {
      // Create a question using an entity
      const e = await prisma.entity.create({ data: { name: 'TEST_ENTITY_IN_USE', type: 'player' } });
      await prisma.question.create({
        data: {
          title: 'Test Q', module: 'players', difficulty: 'easy', answerCount: 1, createdBy: adminId,
          answers: { create: { entityId: e.id, rank: 1, statValue: '1' } }
        }
      });

      const response = await request(app)
        .delete(`/api/admin/entities/${e.id}`)
        .set('x-admin-session', adminToken);

      expect(response.status).toBe(400); // Bad Request because in use
      
      // Cleanup
      await prisma.questionAnswer.deleteMany({ where: { entityId: e.id } });
      await prisma.question.deleteMany({ where: { createdBy: adminId } });
      await prisma.entity.delete({ where: { id: e.id } });
    });
  });
});
