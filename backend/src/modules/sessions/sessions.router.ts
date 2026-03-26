import { Router } from 'express';
import SessionController from './sessions.controller';
import { authMiddleware as authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { submitSessionSchema } from './sessions.schema';

const router = Router();

/**
 * @route   POST /api/v1/sessions/:id/submit
 * @desc    Submit answers for a session
 * @access  Private (Authenticated users only)
 */
router.post(
  '/:id/submit',
  authenticate,
  validate(submitSessionSchema),
  SessionController.submitSession
);

/**
 * @route   GET /api/v1/sessions/:id/result
 * @desc    Get session results (with blur logic)
 * @access  Private (Authenticated users only)
 */
router.get('/:id/result', authenticate, SessionController.getResult);

/**
 * @route   POST /api/v1/sessions/:id/ad-reward
 * @desc    Apply ad reward multiplier (x1.5)
 * @access  Private (Authenticated users only)
 */
router.post('/:id/ad-reward', authenticate, SessionController.applyAdReward);

export default router;
