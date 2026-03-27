// src/modules/admin/questions/admin-questions.router.ts
import { Router } from 'express';
import { adminQuestionsController } from './admin-questions.controller';
import { rbacMiddleware } from '../../../middleware/rbac.middleware';
import { AdminRole } from '@prisma/client';
import { validate } from '../../../middleware/validate.middleware';
import { adminQuestionsSchema } from './admin-questions.schema';

const router = Router();

// Çoğu soru işlemi editor rolü gerektirir.
// Görüntüleme ise moderator yetkisiyle de yapılabilir.
router.get('/', rbacMiddleware(AdminRole.moderator), adminQuestionsController.getAll);
router.get('/pool-health', rbacMiddleware(AdminRole.moderator), adminQuestionsController.getPoolHealth);
router.get('/calendar', rbacMiddleware(AdminRole.moderator), adminQuestionsController.getCalendar);
router.get('/:id', rbacMiddleware(AdminRole.moderator), adminQuestionsController.getById);

router.post('/', rbacMiddleware(AdminRole.editor), validate(adminQuestionsSchema.create), adminQuestionsController.create);
router.patch('/:id', rbacMiddleware(AdminRole.editor), validate(adminQuestionsSchema.update), adminQuestionsController.update);
router.post('/:id/archive', rbacMiddleware(AdminRole.editor), adminQuestionsController.archive);

export { router as adminQuestionsRouter };
