// tests/unit/middleware/cheat-detect.middleware.test.ts
import { Request, Response } from 'express';
import { cheatDetectMiddleware } from '../../../src/middleware/cheat-detect.middleware';
import { prisma } from '../../../src/config/database';

jest.mock('../../../src/config/database', () => ({
  prisma: {
    gameSession: {
      findUnique: jest.fn(),
    },
  },
}));

describe('CheatDetectMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock = jest.fn();

  beforeEach(() => {
    mockRequest = {
      params: { sessionId: 'session-1' }
    };
    // Tip hatasını önlemek için 'user'ı cast ederek ekliyoruz
    (mockRequest as any).user = { id: 'user-1' };
    mockResponse = {};
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should flag suspicious if duration is too short', async () => {
    const startedAt = new Date(Date.now() - 10 * 1000); // 10 saniye önce
    (prisma.gameSession.findUnique as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      startedAt,
      question: { answerCount: 5 } // 5 * 4 = 20s gerekli
    });

    await cheatDetectMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect((mockRequest as any).isSuspicious).toBe(true);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should not flag if duration is sufficient', async () => {
    const startedAt = new Date(Date.now() - 30 * 1000); // 30 saniye önce
    (prisma.gameSession.findUnique as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      startedAt,
      question: { answerCount: 5 } // 5 * 4 = 20s gerekli
    });

    await cheatDetectMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect((mockRequest as any).isSuspicious).toBeUndefined();
    expect(nextFunction).toHaveBeenCalled();
  });
});
