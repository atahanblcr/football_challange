// src/modules/admin/stats/admin-stats.router.ts
import { Router } from 'express';
import { adminStatsController } from './admin-stats.controller';
import { rbacMiddleware } from '../../../middleware/rbac.middleware';
import { AdminRole } from '@prisma/client';

const router = Router();

router.use(rbacMiddleware(AdminRole.moderator));

router.get('/dashboard', adminStatsController.getDashboard);

export { router as adminStatsRouter };
