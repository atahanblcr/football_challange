import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { jwtUtil } from '../../src/utils/jwt.util';
import { QuestionModule, Difficulty, QuestionStatus, EntityType } from '@prisma/client';

describe('Sessions Integration Tests', () => {
  let userToken: string;
  let premiumToken: string;
  let userId: string;
  let premiumUserId: string;
  let questionId: string;
  let entityIds: string[] = [];

  beforeAll(async () => {
    // 1. Create test users
    const user = await prisma.user.create({
      data: {
        nickname: 'session_user',
        email: 'session@example.com',
        authProvider: 'email',
        referralCode: 'SESS123',
        subscriptionTier: 'free',
        countryCode: 'TR'
      }
    });
    userId = user.id;
    userToken = jwtUtil.generateAccessToken({ userId: user.id, role: 'user' });

    const pUser = await prisma.user.create({
      data: {
        nickname: 'premium_user',
        email: 'premium@example.com',
        authProvider: 'email',
        referralCode: 'PREM123',
        subscriptionTier: 'premium',
        countryCode: 'TR'
      }
    });
    premiumUserId = pUser.id;
    premiumToken = jwtUtil.generateAccessToken({ userId: pUser.id, role: 'user' });

    // 2. Setup Entities
    const entities = await Promise.all([
      prisma.entity.create({ data: { name: 'Messi', type: 'player' as EntityType } }),
      prisma.entity.create({ data: { name: 'Ronaldo', type: 'player' as EntityType } }),
      prisma.entity.create({ data: { name: 'Neymar', type: 'player' as EntityType } }),
    ]);
    entityIds = entities.map(e => e.id);

    // 3. Setup Question
    const q = await prisma.question.create({
      data: {
        title: 'Top Scorers Question',
        module: 'players' as QuestionModule,
        difficulty: 'medium' as Difficulty,
        status: 'active' as QuestionStatus,
        basePoints: 100,
        timeLimit: 60,
        answerCount: 3,
        createdBy: 'test_admin',
        answers: {
          create: [
            { entityId: entityIds[0], rank: 1, statValue: '800', statDisplay: '800 goals' },
            { entityId: entityIds[1], rank: 2, statValue: '850', statDisplay: '850 goals' },
            { entityId: entityIds[2], rank: 3, statValue: '400', statDisplay: '400 goals' },
          ]
        }
      }
    });
    questionId = q.id;
  });

  afterAll(async () => {
    await prisma.pointHistory.deleteMany();
    await prisma.gameSession.deleteMany();
    await prisma.questionAnswer.deleteMany();
    await prisma.question.deleteMany({ where: { createdBy: 'test_admin' } });
    await prisma.entity.deleteMany({ where: { id: { in: entityIds } } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, premiumUserId] } } });
  });

  describe('Session Lifecycle', () => {
    let sessionId: string;

    it('should start a session successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/questions/${questionId}/start`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('sessionId');
      expect(response.body.data).toHaveProperty('questionTitle', 'Top Scorers Question');
      sessionId = response.body.data.sessionId;
    });

    it('should prevent starting the same session twice (cooldown)', async () => {
      const response = await request(app)
        .post(`/api/v1/questions/${questionId}/start`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(409);
    });

    it('should submit answers and return results (free user - blurred)', async () => {
      // Messi (rank 1) correct, Neymar (rank 3) correct, Ronaldo (rank 2) MISSED.
      const response = await request(app)
        .post(`/api/v1/sessions/${sessionId}/submit`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ answers: [entityIds[0], entityIds[2]] });

      if (response.status !== 200) console.log('SUBMIT ERROR:', JSON.stringify(response.body, null, 2));

      expect(response.status).toBe(200);
      expect(response.body.data.score.final).toBeGreaterThan(0);
      
      // Blur check
      const rank2Answer = response.body.data.answers.find((a: any) => a.rank === 2);
      expect(rank2Answer.blurred).toBe(true);
      expect(rank2Answer).not.toHaveProperty('entity');
    });

    it('should show all answers to premium user (not blurred)', async () => {
      // 1. Start session for premium user
      const startRes = await request(app)
        .post(`/api/v1/questions/${questionId}/start`)
        .set('Authorization', `Bearer ${premiumToken}`);
      const pSessionId = startRes.body.data.sessionId;

      // 2. Submit only 1 correct answer
      const submitRes = await request(app)
        .post(`/api/v1/sessions/${pSessionId}/submit`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .send({ answers: [entityIds[0]] });

      expect(submitRes.status).toBe(200);
      // Even the one missed (rank 2) should NOT be blurred for premium
      const rank2Answer = submitRes.body.data.answers.find((a: any) => a.rank === 2);
      expect(rank2Answer.blurred).toBe(false);
      expect(rank2Answer.entity.name).toBe('Ronaldo');
    });

    it('should apply ad reward multiplier', async () => {
      // 1. Get Ad Intent Token
      const intentRes = await request(app)
        .post(`/api/v1/sessions/${sessionId}/ad-intent`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(intentRes.status).toBe(200);
      const adToken = intentRes.body.data.adToken;

      // 2. Apply Ad Reward with Token
      const response = await request(app)
        .post(`/api/v1/sessions/${sessionId}/ad-reward`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ adToken });

      expect(response.status).toBe(200);
      expect(response.body.data.adMultiplied).toBe(true);
    });
  });
});
