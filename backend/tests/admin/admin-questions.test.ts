import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { jwtUtil } from '../../src/utils/jwt.util';
import { QuestionModule, Difficulty, QuestionStatus, EntityType } from '@prisma/client';

describe('Admin Questions Integration Tests', () => {
  let adminToken: string;
  let adminId: string;
  let testEntityIds: string[] = [];

  beforeAll(async () => {
    // 1. Create a test admin
    const admin = await prisma.adminUser.create({
      data: {
        email: 'test_admin_q@example.com',
        passwordHash: 'hashed_pw',
        role: 'super_admin',
      }
    });
    adminId = admin.id;
    adminToken = jwtUtil.generateAdminSessionToken({ adminId: admin.id, role: 'super_admin' });

    // 2. Create test entities
    const e1 = await prisma.entity.create({
      data: { name: 'Admin Test Player 1', type: 'player' as EntityType }
    });
    const e2 = await prisma.entity.create({
      data: { name: 'Admin Test Player 2', type: 'player' as EntityType }
    });
    testEntityIds = [e1.id, e2.id];
  });

  afterAll(async () => {
    // Cleanup
    await prisma.questionAnswer.deleteMany();
    await prisma.question.deleteMany({ where: { createdBy: adminId } });
    await prisma.entity.deleteMany({ where: { id: { in: testEntityIds } } });
    await prisma.adminUser.delete({ where: { id: adminId } });
  });

  describe('POST /api/admin/questions', () => {
    it('should create a new question with answers', async () => {
      const payload = {
        title: 'New Admin Question',
        module: 'players',
        difficulty: 'medium',
        basePoints: 100,
        timeLimit: 60,
        answers: [
          { entityId: testEntityIds[0], rank: 1, statValue: '10', statDisplay: '10 points' },
          { entityId: testEntityIds[1], rank: 2, statValue: '20', statDisplay: '20 points' },
        ],
      };

      const response = await request(app)
        .post('/api/admin/questions')
        .set('x-admin-session', adminToken)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe(payload.title);
      expect(response.body.data.answerCount).toBe(2);
      
      // Verify in DB
      const dbQ = await prisma.question.findUnique({
        where: { id: response.body.data.id },
        include: { answers: true }
      });
      expect(dbQ?.answers.length).toBe(2);
      expect(dbQ?.status).toBe('draft');
    });

    it('should return 401 without admin token', async () => {
      const response = await request(app).post('/api/admin/questions').send({});
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/questions', () => {
    it('should list questions with filters', async () => {
      const response = await request(app)
        .get('/api/admin/questions')
        .set('x-admin-session', adminToken)
        .query({ module: 'players', search: 'Admin' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /api/admin/questions/:id/archive', () => {
    it('should archive a question', async () => {
      const q = await prisma.question.findFirst({ where: { createdBy: adminId } });
      
      const response = await request(app)
        .post(`/api/admin/questions/${q?.id}/archive`)
        .set('x-admin-session', adminToken);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('archived');

      const updatedQ = await prisma.question.findUnique({ where: { id: q?.id } });
      expect(updatedQ?.status).toBe('archived');
    });
  });
});
