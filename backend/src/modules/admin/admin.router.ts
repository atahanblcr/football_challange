// src/modules/admin/admin.router.ts
import { Router } from 'express';
import { adminAuthMiddleware } from '../../middleware/admin-auth.middleware';
import { adminAdminsRouter } from './admins/admin-admins.router';
import { adminEntitiesRouter } from './entities/admin-entities.router';
import { adminEventsRouter } from './events/admin-events.router';
import { adminQuestionsRouter } from './questions/admin-questions.router';
import { adminStatsRouter } from './stats/admin-stats.router';
import { adminUsersRouter } from './users/admin-users.router';
import { adminAdminsController } from './admins/admin-admins.controller';
import { rateLimitMiddleware } from '../../middleware/rate-limit.middleware';

const router = Router();

// 1. PUBLIC ADMIN ROUTES (No Auth)
router.post('/auth/login', rateLimitMiddleware(5, 15 * 60), adminAdminsController.login);

// 2. PROTECTED ADMIN ROUTES (Auth Required)
router.use(adminAuthMiddleware);

// Auth Module (Protected parts)
router.get('/auth/me', adminAdminsController.me);
router.post('/auth/logout', adminAdminsController.logout);

// Other Modules
router.use('/admins', adminAdminsRouter);
router.use('/entities', adminEntitiesRouter);
router.use('/events', adminEventsRouter);
router.use('/questions', adminQuestionsRouter);
router.use('/stats', adminStatsRouter);
router.use('/users', adminUsersRouter);

export { router as adminRouter };
