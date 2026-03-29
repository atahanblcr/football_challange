// src/modules/auth/auth.router.ts
import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate.middleware'; // Yazılacak
import { registerSchema, loginSchema, googleLoginSchema, refreshTokenSchema } from './auth.schema';
import { rateLimitMiddleware } from '../../middleware/rate-limit.middleware';

const router = Router();
const controller = new AuthController();

// Auth endpoint'leri için rate limit (15 dakikada 10 istek)
const authRateLimit = rateLimitMiddleware(10, 15 * 60);

router.post('/email/register', authRateLimit, validate(registerSchema), controller.register);
router.post('/email/login', authRateLimit, validate(loginSchema), controller.login);
router.post('/google', authRateLimit, validate(googleLoginSchema), controller.googleLogin);
router.post('/refresh', validate(refreshTokenSchema), controller.refresh);
router.post('/logout', controller.logout);

export default router;
