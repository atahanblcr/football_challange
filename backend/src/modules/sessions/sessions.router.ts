import { Router } from 'express';
import SessionController from './sessions.controller';
import { authMiddleware as authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { submitSessionSchema, adRewardSchema } from './sessions.schema';

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
 * @route   POST /api/v1/sessions/:id/ad-intent
 * @desc    Generate ad intent token for reward validation
 * @access  Private
 */
router.post('/:id/ad-intent', authenticate, SessionController.generateAdIntent);

/**
 * @route   POST /api/v1/sessions/:id/ad-reward
 * @desc    Apply ad reward multiplier (x1.5)
 * @access  Private
 */
router.post(
  '/:id/ad-reward',
  authenticate,
  validate(adRewardSchema),
  SessionController.applyAdReward
);

export default router;
