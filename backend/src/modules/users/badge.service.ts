
import { prisma } from '../../config/database';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export class BadgeService {
  /**
   * Checks for and awards new badges to a user based on their stats.
   */
  public async checkAndAwardBadges(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        _count: { select: { gameSessions: true } },
        pointHistory: { select: { points: true } }
      }
    });

    if (!user) return [];

    const currentBadges = (user.badges as any[]) || [];
    const earnedBadgeIds = currentBadges.map(b => b.id);
    const newBadges: Badge[] = [];

    const totalPoints = user.pointHistory.reduce((sum, p) => sum + p.points, 0);
    const totalSolved = user._count.gameSessions;

    // Badge logic
    
    // 1. Rookie (First Question)
    if (totalSolved >= 1 && !earnedBadgeIds.includes('rookie')) {
      newBadges.push({
        id: 'rookie',
        name: 'Çaylak',
        description: 'İlk sorunu çözdün!',
        icon: '⚽',
        earnedAt: new Date().toISOString()
      });
    }

    // 2. Veteran (10 Questions)
    if (totalSolved >= 10 && !earnedBadgeIds.includes('veteran')) {
      newBadges.push({
        id: 'veteran',
        name: 'Deneyimli',
        description: '10 soru barajını aştın!',
        icon: '🎖️',
        earnedAt: new Date().toISOString()
      });
    }

    // 3. High Scorer (5000+ points)
    if (totalPoints >= 5000 && !earnedBadgeIds.includes('high_scorer')) {
      newBadges.push({
        id: 'high_scorer',
        name: 'Gol Kralı',
        description: '5000 puanı devirdin!',
        icon: '👑',
        earnedAt: new Date().toISOString()
      });
    }

    if (newBadges.length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          badges: [...currentBadges, ...newBadges]
        }
      });
    }

    return [...currentBadges, ...newBadges];
  }
}

export default new BadgeService();
