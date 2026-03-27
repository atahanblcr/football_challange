// src/middleware/rate-limit.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { redisKeys } from '../utils/redis-keys.util';
import { ApiError } from '../errors/api-error';
import { ErrorCode } from '../errors/error-codes';

/**
 * Redis tabanlı Rate Limiting.
 * Belirli bir IP ve endpoint için istek sayısını sınırlar.
 */
export const rateLimitMiddleware = (limit: number, windowSeconds: number) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const endpoint = req.originalUrl || (req.baseUrl + req.path);
    console.log(`[RateLimit] IP: ${ip}, Endpoint: ${endpoint}, BaseUrl: ${req.baseUrl}, Path: ${req.path}`);
    const key = redisKeys.rateLimit(ip, endpoint);

    try {
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (current > limit) {
        throw new ApiError(429, ErrorCode.RATE_LIMIT_EXCEEDED, 'Çok fazla istek gönderildi. Lütfen bekleyin.');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
