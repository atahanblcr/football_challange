// tests/unit/middleware/rate-limit.middleware.test.ts
import { Request, Response } from 'express';
import { rateLimitMiddleware } from '../../../src/middleware/rate-limit.middleware';
import { redis } from '../../../src/config/redis';
import { ApiError } from '../../../src/errors/api-error';

jest.mock('../../../src/config/redis', () => ({
  redis: {
    incr: jest.fn(),
    expire: jest.fn(),
  },
}));

describe('RateLimitMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock = jest.fn();

  beforeEach(() => {
    mockRequest = { ip: '127.0.0.1', baseUrl: '/api', path: '/test' };
    mockResponse = {};
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should allow request if limit not exceeded', async () => {
    (redis.incr as jest.Mock).mockResolvedValue(5);
    const middleware = rateLimitMiddleware(10, 60);

    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith();
  });

  it('should call expire on first request', async () => {
    (redis.incr as jest.Mock).mockResolvedValue(1);
    const middleware = rateLimitMiddleware(10, 60);

    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(redis.expire).toHaveBeenCalled();
    expect(nextFunction).toHaveBeenCalledWith();
  });

  it('should throw error if limit exceeded', async () => {
    (redis.incr as jest.Mock).mockResolvedValue(11);
    const middleware = rateLimitMiddleware(10, 60);

    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    const error = nextFunction.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
