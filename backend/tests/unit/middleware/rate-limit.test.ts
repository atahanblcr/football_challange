import { Request, Response, NextFunction } from 'express';
import { rateLimitMiddleware } from '../../../src/middleware/rate-limit.middleware';
import { redis } from '../../../src/config/redis';
import { ApiError } from '../../../src/errors/api-error';

describe('Rate Limit Middleware Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      baseUrl: '/api/v1',
      path: '/search',
    };
    mockResponse = {};
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should allow request if limit is NOT exceeded', async () => {
    (redis.incr as jest.Mock).mockResolvedValue(5); // Current = 5
    const limit = 10;
    const window = 60;

    const middleware = rateLimitMiddleware(limit, window);
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith();
    expect(nextFunction).not.toHaveBeenCalledWith(expect.any(Error));
  });

  it('should block request and throw 429 if limit IS exceeded', async () => {
    (redis.incr as jest.Mock).mockResolvedValue(11); // Current = 11, Limit = 10
    const limit = 10;
    const window = 60;

    const middleware = rateLimitMiddleware(limit, window);
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(ApiError));
    const error = (nextFunction as jest.Mock).mock.calls[0][0];
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('should set expiration on the first request', async () => {
    (redis.incr as jest.Mock).mockResolvedValue(1); // First request
    const limit = 10;
    const window = 60;

    const middleware = rateLimitMiddleware(limit, window);
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(redis.expire).toHaveBeenCalled();
  });
});
