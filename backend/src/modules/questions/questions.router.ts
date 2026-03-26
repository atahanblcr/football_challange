import { Router } from 'express';
import QuestionController from './questions.controller';
import SessionController from '../sessions/sessions.controller';
import { authMiddleware as authenticate } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/v1/questions/daily
 * @desc    Get today's assigned questions (no titles)
 * @access  Private (Authenticated users only)
 */
router.get('/daily', authenticate, QuestionController.getDailyQuestions);

/**
 * @route   GET /api/v1/questions/:id/meta
 * @desc    Get question metadata (difficulty, duration, answer count)
 * @access  Private (Authenticated users only)
 */
router.get('/:id/meta', authenticate, QuestionController.getQuestionMeta);

/**
 * @route   POST /api/v1/questions/:id/start
 * @desc    Start a new game session for a question
 * @access  Private (Authenticated users only)
 */
router.post('/:id/start', authenticate, SessionController.startSession);

export default router;
