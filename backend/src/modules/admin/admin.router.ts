// src/modules/admin/admin.router.ts
import { Router } from 'express';
import { adminAuthMiddleware } from '../../middleware/admin-auth.middleware';
import { adminAdminsRouter } from './admins/admin-admins.router';
import { adminEntitiesRouter } from './entities/admin-entities.router';
import { adminEventsRouter } from './events/admin-events.router';
import { adminQuestionsRouter } from './questions/admin-questions.router';
import { adminStatsRouter } from './stats/admin-stats.router';
import { adminUsersRouter } from './users/admin-users.router';

const router = Router();

/**
 * Tüm /api/admin/* route'larını toplar.
 * Bazı route'lar (login gibi) auth gerektirmez, 
 * diğerleri adminAuthMiddleware ile korunur.
 */

// Auth gerektirmeyen admin route'ları (Login vb. admins router içinde tanımlı olmalı)
router.use('/auth', adminAdminsRouter);

// Auth gerektiren tüm admin modülleri
router.use(adminAuthMiddleware);

router.use('/admins', adminAdminsRouter);
router.use('/entities', adminEntitiesRouter);
router.use('/events', adminEventsRouter);
router.use('/questions', adminQuestionsRouter);
router.use('/stats', adminStatsRouter);
router.use('/users', adminUsersRouter);

export { router as adminRouter };
