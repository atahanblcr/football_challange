import { SubscriptionTier, QuestionModule, QuestionStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../errors/api-error';
import { ErrorCode } from '../../errors/error-codes';
import QuestionService from '../questions/questions.service';
import { ScoringService } from '../scoring/scoring.service';
import LeaderboardService from '../leaderboard/leaderboard.service';
import BadgeService from '../users/badge.service';

export class SessionService {
  /**
   * Starts a new game session.
   */
  public async startSession(userId: string, questionId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, ErrorCode.NOT_FOUND, 'Kullanıcı bulunamadı.');

    const question = await QuestionService.getQuestionMeta(questionId);

    // 1. Check if the session already exists (cooldown)
    const existingSession = await prisma.gameSession.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });

    // GELİŞTİRME MODUNDA: Eğer oturum varsa silip yenisini başlatalım (Test kolaylığı için)
    if (existingSession && process.env.NODE_ENV === 'development') {
      await prisma.gameSession.delete({
        where: { id: existingSession.id }
      });
    } else if (existingSession) {
      throw new ApiError(409, ErrorCode.SESSION_ALREADY_EXISTS, 'Bu soruyu zaten çözdünüz.');
    }

    // 2. Check Daily Limit and determine session type
    const today = this.getTodayUTC3();
    const isPremium = user.subscriptionTier === SubscriptionTier.premium;
    
    // Check if this is the daily assigned normal question
    const assignment = await prisma.dailyQuestionAssignment.findFirst({
      where: {
        date: today,
        module: question.module as QuestionModule,
        questionId: questionId,
        isExtra: false,
      }
    });

    const isNormal = !!assignment;
    await this.checkAndConsumeDailyLimit(userId, question.module as QuestionModule, question.isSpecial, isNormal, isPremium);

    // 3. Create Session
    const now = new Date();
    const cooldownUntil = new Date();
    cooldownUntil.setDate(now.getDate() + 90);

    const session = await prisma.gameSession.create({
      data: {
        userId,
        questionId,
        startedAt: now,
        cooldownUntil,
      },
    });

    // 4. Return session ID and Question details
    const fullQuestion = await QuestionService.getQuestionById(questionId);
    return {
      sessionId: session.id,
      questionId: fullQuestion.id,
      questionTitle: fullQuestion.title,
      module: fullQuestion.module,
      difficulty: fullQuestion.difficulty,
      answerCount: fullQuestion.answerCount,
      timeLimit: fullQuestion.timeLimit,
      startedAt: session.startedAt,
    };
  }

  /**
   * Submits answers for a session and calculates points.
   */
  public async submitSession(userId: string, sessionId: string, submittedAnswers: string[]) {
    // 1. Fetch session and config first (Read-only)
    const [session, config] = await Promise.all([
      prisma.gameSession.findUnique({
        where: { id: sessionId },
        include: { 
          question: { include: { answers: true } },
          user: { select: { countryCode: true } }
        },
      }),
      prisma.appConfig.findFirst()
    ]);

    if (!session) throw new ApiError(404, ErrorCode.NOT_FOUND, 'Oturum bulunamadı.');
    if (session.userId !== userId) throw new ApiError(403, ErrorCode.FORBIDDEN, 'Bu oturum size ait değil.');
    if (session.submittedAt) throw new ApiError(409, ErrorCode.SESSION_ALREADY_EXISTS, 'Bu oturum zaten tamamlanmış.');

    const question = session.question;
    const now = new Date();
    const durationSeconds = Math.floor((now.getTime() - session.startedAt.getTime()) / 1000);
    const remainingSeconds = Math.max(0, question.timeLimit - durationSeconds);

    // 2. Evaluate Answers
    const correctRanks: number[] = [];
    const wrongEntityIds: string[] = [];
    const correctAnswers = question.answers;

    submittedAnswers.forEach((entityId) => {
      const match = correctAnswers.find((ans) => ans.entityId === entityId);
      if (match) {
        correctRanks.push(match.rank);
      } else {
        wrongEntityIds.push(entityId);
      }
    });

    const allSlotsFilled = submittedAnswers.length >= question.answerCount;

    // 3. Calculate Score
    const scoreDetails = ScoringService.calculateFinalScore({
      correctRanks,
      totalAnswers: question.answerCount,
      basePoints: question.basePoints,
      timeLimit: question.timeLimit,
      remainingSeconds,
      allSlotsFilled,
      difficulty: question.difficulty,
      config: config ? {
        adMultiplier: config.adMultiplier,
        difficultyMediumMultiplier: config.difficultyMediumMultiplier,
        difficultyHardMultiplier: config.difficultyHardMultiplier,
        maxTimeBonus: config.maxTimeBonus,
      } : undefined
    });

    // 4. Cheat Detection
    let flagSuspicious = false;
    let suspiciousReason = null;
    const minRequiredTime = question.answerCount * 4;
    
    if (durationSeconds < minRequiredTime) {
      flagSuspicious = true;
      suspiciousReason = `Hızlı tamamlama: ${durationSeconds}s (Gereken: ${minRequiredTime}s)`;
    }

    // 5. ATOMIC UPDATE using updateMany to prevent race conditions
    // We update only if submittedAt is still NULL.
    const updateResult = await prisma.gameSession.updateMany({
      where: {
        id: sessionId,
        submittedAt: null
      },
      data: {
        submittedAt: now,
        submittedAnswers,
        correctRanks,
        wrongEntityIds,
        allSlotsFilled,
        scoreBase: scoreDetails.scoreBase,
        scoreTimeBonus: scoreDetails.scoreTimeBonus,
        scoreDifficulty: scoreDetails.scoreDifficulty,
        scoreFinal: scoreDetails.scoreFinal,
        flagSuspicious,
        suspiciousReason,
      },
    });

    if (updateResult.count === 0) {
      // Someone else submitted this session between our read and update.
      throw new ApiError(409, ErrorCode.SESSION_ALREADY_EXISTS, 'Bu oturum zaten tamamlanmış.');
    }

    // 6. Side Effects (Point History, Leaderboard, Badges)
    if (scoreDetails.scoreFinal > 0) {
      await prisma.pointHistory.create({
        data: {
          userId,
          sessionId: sessionId,
          module: question.module,
          isSpecial: question.isSpecial,
          points: scoreDetails.scoreFinal,
        },
      });
      
      await LeaderboardService.addScore({
        userId,
        score: scoreDetails.scoreFinal,
        module: question.module,
        countryCode: session.user.countryCode || undefined,
        isSpecial: question.isSpecial,
        specialEventId: question.specialEventId || undefined,
      });

      await BadgeService.checkAndAwardBadges(userId);
    }

    return await this.getSessionResult(userId, sessionId);
  }

  /**
   * Gets session results with blur logic.
   */
  public async getSessionResult(userId: string, sessionId: string) {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        user: { select: { subscriptionTier: true, countryCode: true } },
        question: { include: { answers: { include: { entity: true } } } },
      },
    });

    if (!session) throw new ApiError(404, ErrorCode.NOT_FOUND, 'Oturum bulunamadı.');
    if (session.userId !== userId) throw new ApiError(403, ErrorCode.FORBIDDEN, 'Bu oturum size ait değil.');
    if (!session.submittedAt) throw new ApiError(400, ErrorCode.VALIDATION_ERROR, 'Oturum henüz tamamlanmadı.');

    const isPremium = session.user.subscriptionTier === SubscriptionTier.premium;
    const allAnswers = session.question.answers;

    const resultAnswers = allAnswers.map((ans) => {
      const isCorrect = session.correctRanks.includes(ans.rank);
      
      if (isCorrect || isPremium) {
        return {
          rank: ans.rank,
          entity: {
            id: ans.entity.id,
            name: ans.entity.name,
            imagePath: ans.entity.imagePath,
          },
          statValue: ans.statValue,
          statDisplay: ans.statDisplay,
          blurred: false,
          isCorrect,
        };
      }

      // Free user and not guessed correctly => BLURRED
      return {
        rank: ans.rank,
        blurred: true,
        isCorrect: false,
      };
    });

    return {
      sessionId: session.id,
      questionTitle: session.question.title,
      score: {
        base: session.scoreBase,
        timeBonus: session.scoreTimeBonus,
        difficulty: session.scoreDifficulty,
        final: session.scoreFinal,
      },
      answers: resultAnswers,
      wrongAnswersCount: session.wrongEntityIds.length,
      adMultiplied: session.adMultiplied,
    };
  }

  /**
   * Generates an ad intent token for reward validation.
   */
  public async generateAdIntent(userId: string, sessionId: string) {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, adMultiplied: true, submittedAt: true }
    });

    if (!session) throw new ApiError(404, ErrorCode.NOT_FOUND, 'Oturum bulunamadı.');
    if (session.userId !== userId) throw new ApiError(403, ErrorCode.FORBIDDEN, 'Bu oturum size ait değil.');
    if (session.adMultiplied) throw new ApiError(409, ErrorCode.AD_ALREADY_USED, 'Bu oturum için zaten ödül alındı.');
    if (!session.submittedAt) throw new ApiError(400, ErrorCode.VALIDATION_ERROR, 'Oturum henüz tamamlanmadı.');

    const adToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const adTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.gameSession.update({
      where: { id: sessionId },
      data: { adToken, adTokenExpiresAt }
    });

    return { adToken };
  }

  /**
   * Applies ad reward multiplier with token verification.
   */
  public async applyAdReward(userId: string, sessionId: string, adToken: string) {
    const [session, config] = await Promise.all([
      prisma.gameSession.findUnique({
        where: { id: sessionId },
        include: { 
          question: { select: { module: true, isSpecial: true, specialEventId: true } },
          user: { select: { countryCode: true } }
        }
      }),
      prisma.appConfig.findFirst()
    ]);

    if (!session) throw new ApiError(404, ErrorCode.NOT_FOUND, 'Oturum bulunamadı.');
    if (session.userId !== userId) throw new ApiError(403, ErrorCode.FORBIDDEN, 'Bu oturum size ait değil.');
    if (session.adMultiplied) throw new ApiError(409, ErrorCode.AD_ALREADY_USED, 'Bu oturum için reklam ödülü zaten kullanıldı.');
    if (!session.submittedAt) throw new ApiError(400, ErrorCode.VALIDATION_ERROR, 'Oturum henüz tamamlanmadı.');

    // Ad Token Verification
    if (!session.adToken || session.adToken !== adToken) {
      throw new ApiError(403, ErrorCode.FORBIDDEN, 'Geçersiz reklam tokenı.');
    }
    if (session.adTokenExpiresAt && session.adTokenExpiresAt < new Date()) {
      throw new ApiError(403, ErrorCode.FORBIDDEN, 'Reklam tokenının süresi dolmuş.');
    }

    const adMultiplier = config?.adMultiplier || 1.5;
    const oldScoreFinal = session.scoreFinal;
    const newScoreFinal = Math.floor(session.scoreDifficulty * adMultiplier);
    const scoreDiff = newScoreFinal - oldScoreFinal;

    await prisma.$transaction([
      prisma.gameSession.update({
        where: { id: sessionId },
        data: {
          scoreFinal: newScoreFinal,
          adMultiplied: true,
          adToken: null, // Consume token
          adTokenExpiresAt: null,
        },
      }),
      prisma.pointHistory.updateMany({
        where: { sessionId: sessionId },
        data: {
          points: newScoreFinal,
        },
      }),
    ]);

    // Update Redis Leaderboard with the DIFFERENCE
    if (scoreDiff > 0) {
      await LeaderboardService.addScore({
        userId,
        score: scoreDiff,
        module: session.question.module,
        countryCode: session.user.countryCode || undefined,
        isSpecial: session.question.isSpecial,
        specialEventId: session.question.specialEventId || undefined,
      });

      // Check for badges after score increase
      await BadgeService.checkAndAwardBadges(userId);
    }

    return this.getSessionResult(userId, sessionId);
  }

  /**
   * Checks and consumes daily limit using DailyUserLimit table.
   */
  private async checkAndConsumeDailyLimit(
    userId: string, 
    module: QuestionModule, 
    isSpecial: boolean, 
    isNormal: boolean,
    isPremium: boolean
  ) {
    if (process.env.NODE_ENV === 'development') return;

    const today = this.getTodayUTC3();

    // Special Event: Limit 1 session per day
    if (isSpecial) {
      const specialSessionCount = await prisma.gameSession.count({
        where: {
          userId,
          startedAt: { gte: today },
          question: { isSpecial: true }
        }
      });
      if (specialSessionCount >= 1) {
        throw new ApiError(409, ErrorCode.DAILY_LIMIT_REACHED, 'Özel etkinlik sorusu limiti doldu.');
      }
      return;
    }

    // Normal Modules
    const limitRecord = await prisma.dailyUserLimit.upsert({
      where: {
        userId_date_module: { userId, date: today, module }
      },
      update: {},
      create: { userId, date: today, module }
    });

    if (isNormal) {
      // Premium users can solve normal question twice
      if (limitRecord.normalSolved) {
        const sessionCount = await prisma.gameSession.count({
          where: {
            userId,
            startedAt: { gte: today },
            question: { module, isSpecial: false }
          }
        });
        
        const maxNormal = isPremium ? 2 : 1;
        if (sessionCount >= maxNormal) {
          throw new ApiError(409, ErrorCode.DAILY_LIMIT_REACHED, 'Bu modül için günlük soru limitiniz doldu.');
        }
      }

      // Mark as solved
      await prisma.dailyUserLimit.update({
        where: { id: limitRecord.id },
        data: { normalSolved: true }
      });
    } else {
      // Extra question (from ad)
      if (limitRecord.adSolved) {
        throw new ApiError(409, ErrorCode.DAILY_LIMIT_REACHED, 'Bu modül için reklamlı ekstra soru limitiniz doldu.');
      }
      
      // Mark as solved
      await prisma.dailyUserLimit.update({
        where: { id: limitRecord.id },
        data: { adSolved: true }
      });
    }
  }

  private getTodayUTC3(): Date {
    const now = new Date();
    // Istanbul is UTC+3
    const istanbulOffset = 3 * 60; 
    const localTime = now.getTime();
    const localOffset = now.getTimezoneOffset() * 60000;
    const utcTime = localTime + localOffset;
    const istanbulTime = new Date(utcTime + (3 * 3600000));
    
    const dateString = istanbulTime.toISOString().split('T')[0];
    return new Date(dateString);
  }
}

export default new SessionService();
