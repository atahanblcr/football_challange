// src/modules/admin/events/admin-events.router.ts
import { Router } from 'express';
import { adminEventsController } from './admin-events.controller';
import { rbacMiddleware } from '../../../middleware/rbac.middleware';
import { AdminRole } from '@prisma/client';
import { validate } from '../../../middleware/validate.middleware';
import { adminEventsSchema } from './admin-events.schema';

const router = Router();

router.use(rbacMiddleware(AdminRole.editor));

router.get('/', adminEventsController.getAll);
router.post('/', validate(adminEventsSchema.create), adminEventsController.create);
router.patch('/:id', validate(adminEventsSchema.update), adminEventsController.update);
router.post('/:id/activate', adminEventsController.activate);
router.delete('/:id', adminEventsController.delete);

export { router as adminEventsRouter };
