import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { jwtUtil } from '../../src/utils/jwt.util';
import { QuestionModule, Difficulty, QuestionStatus } from '@prisma/client';

describe('Questions Integration Tests', () => {
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    // 1. Create a test user
    const user = await prisma.user.create({
      data: {
        nickname: 'test_q_user',
        email: 'test_q@example.com',
        authProvider: 'email',
        referralCode: 'QTEST123',
      }
    });
    userId = user.id;
    userToken = jwtUtil.generateAccessToken({ userId: user.id, role: 'user' });

    // 2. Clear previous assignments
    await prisma.dailyQuestionAssignment.deleteMany();
    await prisma.questionAnswer.deleteMany();
    await prisma.question.deleteMany({ where: { createdBy: 'test_admin' } });

    // 3. Seed some test questions
    const q1 = await prisma.question.create({
      data: {
        title: 'Daily Players Question',
        module: 'players' as QuestionModule,
        difficulty: 'easy' as Difficulty,
        status: 'active' as QuestionStatus,
        basePoints: 100,
        timeLimit: 60,
        answerCount: 5,
        createdBy: 'test_admin',
      }
    });

    const today = new Date();
    today.setHours(today.getHours() + 3); // UTC+3 logic
    const date = new Date(today.toISOString().split('T')[0]);

    await prisma.dailyQuestionAssignment.create({
      data: {
        date,
        module: 'players' as QuestionModule,
        questionId: q1.id,
      }
    });
  });

  afterAll(async () => {
    await prisma.dailyQuestionAssignment.deleteMany();
    await prisma.questionAnswer.deleteMany();
    await prisma.question.deleteMany({ where: { createdBy: 'test_admin' } });
    await prisma.user.delete({ where: { id: userId } });
  });

  describe('GET /api/v1/questions/daily', () => {
    it('should return daily questions for today', async () => {
      const response = await request(app)
        .get('/api/v1/questions/daily')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      
      const q = response.body[0];
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('module', 'players');
      expect(q).not.toHaveProperty('title'); // Should NOT return title (anti-cheat)
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/v1/questions/daily');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/questions/:id/meta', () => {
    it('should return metadata for a valid question', async () => {
      const q = await prisma.question.findFirst({ where: { createdBy: 'test_admin' } });
      
      const response = await request(app)
        .get(`/api/v1/questions/${q?.id}/meta`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(q?.id);
      expect(response.body).toHaveProperty('difficulty');
      expect(response.body).not.toHaveProperty('title');
    });

    it('should return 404 for non-existent question', async () => {
      const response = await request(app)
        .get('/api/v1/questions/nonexistent-id/meta')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });
});
