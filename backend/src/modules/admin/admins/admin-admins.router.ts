// src/modules/admin/admins/admin-admins.router.ts
import { Router } from 'express';
import { adminAdminsController } from './admin-admins.controller';
import { rbacMiddleware } from '../../../middleware/rbac.middleware';
import { AdminRole } from '@prisma/client';

const router = Router();

// /api/admin/admins/* altındaki route'lar (sadece super_admin)
router.get('/', rbacMiddleware(AdminRole.super_admin), adminAdminsController.getAll);
router.post('/', rbacMiddleware(AdminRole.super_admin), adminAdminsController.create);
router.patch('/:id', rbacMiddleware(AdminRole.super_admin), adminAdminsController.update);
router.delete('/:id', rbacMiddleware(AdminRole.super_admin), adminAdminsController.delete);

export { router as adminAdminsRouter };
