// tests/unit/middleware/auth.middleware.test.ts
import { Request, Response } from 'express';
import { authMiddleware } from '../../../src/middleware/auth.middleware';
import { jwtUtil } from '../../../src/utils/jwt.util';
import { prisma } from '../../../src/config/database';
import { ApiError } from '../../../src/errors/api-error';

jest.mock('../../../src/utils/jwt.util');
jest.mock('../../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('AuthMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock = jest.fn();

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should allow access with valid token', async () => {
    mockRequest.headers!.authorization = 'Bearer valid-token';
    (jwtUtil.verifyAccessToken as jest.Mock).mockReturnValue({ userId: 'user-1' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1', isBanned: false });

    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith();
    expect((mockRequest as any).user).toBeDefined();
  });

  it('should throw unauthorized if no token', async () => {
    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    const error = nextFunction.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(401);
  });

  it('should throw forbidden if user is banned', async () => {
    mockRequest.headers!.authorization = 'Bearer valid-token';
    (jwtUtil.verifyAccessToken as jest.Mock).mockReturnValue({ userId: 'user-1' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1', isBanned: true });

    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    const error = nextFunction.mock.calls[0][0];
    expect(error.statusCode).toBe(403);
  });
});
