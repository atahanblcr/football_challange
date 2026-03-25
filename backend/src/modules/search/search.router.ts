// src/modules/search/search.router.ts
import { Router } from 'express';
import { SearchController } from './search.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { rateLimitMiddleware } from '../../middleware/rate-limit.middleware';

const router = Router();
const controller = new SearchController();

// Arama için rate limit (Dakikada 20 istek)
const searchRateLimit = rateLimitMiddleware(20, 60);

router.use(authMiddleware);
router.get('/', searchRateLimit, controller.search);

export default router;
