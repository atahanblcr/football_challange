import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { jwtUtil } from '../../src/utils/jwt.util';

describe('Sessions Concurrency Tests', () => {
  let userId: string;
  let accessToken: string;
  let questionId: string;
  let sessionId: string;

  beforeAll(async () => {
    // 1. Create Test User
    const user = await prisma.user.create({
      data: {
        nickname: 'ConcurrencyUser',
        email: 'concurrency@test.com',
        authProvider: 'email',
        referralCode: 'CONCUR12',
      },
    });
    userId = user.id;
    accessToken = jwtUtil.generateAccessToken({ userId: user.id, role: 'user' });

    // 2. Create Test Question
    const question = await prisma.question.create({
      data: {
        title: 'Concurrency Test Question',
        module: 'players',
        difficulty: 'easy',
        status: 'active',
        answerCount: 3,
        basePoints: 100,
        createdBy: 'admin',
      },
    });
    questionId = question.id;

    // 3. Start Session
    const startRes = await request(app)
      .post(`/api/v1/questions/${questionId}/start`)
      .set('Authorization', `Bearer ${accessToken}`);
    
    sessionId = startRes.body.data.sessionId;
  });

  afterAll(async () => {
    await prisma.gameSession.deleteMany({ where: { userId } });
    await prisma.question.delete({ where: { id: questionId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('should handle multiple rapid submit requests (race condition)', async () => {
    // Prepare multiple identical submit requests
    const submitData = { answers: [] };
    
    // Fire multiple requests simultaneously
    const requests = [
      request(app).post(`/api/v1/sessions/${sessionId}/submit`).set('Authorization', `Bearer ${accessToken}`).send(submitData),
      request(app).post(`/api/v1/sessions/${sessionId}/submit`).set('Authorization', `Bearer ${accessToken}`).send(submitData),
      request(app).post(`/api/v1/sessions/${sessionId}/submit`).set('Authorization', `Bearer ${accessToken}`).send(submitData),
    ];

    const results = await Promise.all(requests);

    // Count successes and conflicts
    const successes = results.filter(r => r.status === 200);
    const conflicts = results.filter(r => r.status === 409);

    // Only ONE should succeed, others should return 409 (SESSION_ALREADY_EXISTS/Completed)
    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(2);
    expect(conflicts[0].body.error.code).toBe('SESSION_ALREADY_EXISTS');
  });
});
