// src/modules/users/users.router.ts
import { Router } from 'express';
import { UsersController } from './users.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateProfileSchema, checkNicknameSchema } from './users.schema';

const router = Router();
const controller = new UsersController();

// Nickname kontrolü auth gerektirmez (Kayıt ekranında kullanılır)
router.get('/check-nickname/:nickname', validate(checkNicknameSchema), controller.checkNickname);

// Diğer tüm kullanıcı işlemleri auth gerektirir
router.use(authMiddleware);

router.get('/me', controller.getMe);
router.patch('/me', validate(updateProfileSchema), controller.updateMe);
router.delete('/me', controller.deleteAccount);
router.get('/me/history', controller.getHistory);

export default router;
