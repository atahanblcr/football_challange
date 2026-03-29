// src/modules/admin/app-config/admin-app-config.router.ts
import { Router } from 'express';
import { adminAppConfigController } from './admin-app-config.controller';
import { rbacMiddleware } from '../../../middleware/rbac.middleware';
import { AdminRole } from '@prisma/client';

const router = Router();

// Sadece super_admin uygulama ayarlarını değiştirebilir.
// moderator ve editor görebilir (Gerekirse kısıtlanabilir)
router.get('/', rbacMiddleware(AdminRole.moderator), adminAppConfigController.get);
router.patch('/', rbacMiddleware(AdminRole.super_admin), adminAppConfigController.update);

export { router as adminAppConfigRouter };
