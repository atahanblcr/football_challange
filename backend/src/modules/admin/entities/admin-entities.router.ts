// src/modules/admin/entities/admin-entities.router.ts
import { Router } from 'express';
import { adminEntitiesController } from './admin-entities.controller';
import { rbacMiddleware } from '../../../middleware/rbac.middleware';
import { AdminRole } from '@prisma/client';
import { validate } from '../../../middleware/validate.middleware';
import { adminEntitiesSchema } from './admin-entities.schema';

const router = Router();

// Tüm entity işlemleri için en az editor rolü gerekir
router.use(rbacMiddleware(AdminRole.editor));

router.get('/', adminEntitiesController.getAll);
router.get('/search', adminEntitiesController.search);
router.get('/check-duplicate', adminEntitiesController.checkDuplicate);
router.post('/', validate(adminEntitiesSchema.create), adminEntitiesController.create);
router.patch('/:id', validate(adminEntitiesSchema.update), adminEntitiesController.update);
router.delete('/:id', adminEntitiesController.delete);

export { router as adminEntitiesRouter };
