import { Router } from 'express';
import LeaderboardController from './leaderboard.controller';
import { authMiddleware as authenticate } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/v1/leaderboard
 * @desc    Get leaderboard rankings
 * @access  Private (Authenticated users only)
 */
router.get('/', authenticate, LeaderboardController.getLeaderboard);

/**
 * @route   GET /api/v1/leaderboard/me
 * @desc    Get current user's rank
 * @access  Private (Authenticated users only)
 */
router.get('/me', authenticate, LeaderboardController.getMyRank);

export default router;
