// src/modules/admin/users/admin-users.router.ts
import { Router } from 'express';
import { adminUsersController } from './admin-users.controller';
import { rbacMiddleware } from '../../../middleware/rbac.middleware';
import { AdminRole } from '@prisma/client';

const router = Router();

// Görüntüleme ve ban önerisi moderator rolüyle yapılabilir
router.get('/', rbacMiddleware(AdminRole.moderator), adminUsersController.getAll);
router.get('/flagged', rbacMiddleware(AdminRole.moderator), adminUsersController.getFlagged);
router.get('/:id', rbacMiddleware(AdminRole.moderator), adminUsersController.getById);
router.post('/:id/ban-suggest', rbacMiddleware(AdminRole.moderator), adminUsersController.suggestBan);

// Gerçek ban/unban sadece super_admin
router.post('/:id/ban', rbacMiddleware(AdminRole.super_admin), adminUsersController.ban);
router.post('/:id/unban', rbacMiddleware(AdminRole.super_admin), adminUsersController.unban);

export { router as adminUsersRouter };
