import { SubscriptionTier, QuestionModule, QuestionStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../errors/api-error';
import { ErrorCode } from '../../errors/error-codes';
import QuestionService from '../questions/questions.service';
import { ScoringService } from '../scoring/scoring.service';
import LeaderboardService from '../leaderboard/leaderboard.service';

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
    if (existingSession) {
      throw new ApiError(409, ErrorCode.SESSION_ALREADY_EXISTS, 'Bu soruyu zaten çözdünüz.');
    }

    // 2. Check Daily Limit
    await this.checkDailyLimit(user, question.module as QuestionModule, question.isSpecial);

    // 3. Create Session
    const now = new Date();
    const cooldownUntil = new Date();
    cooldownUntil.setDate(now.getDate() + 90); // 90 days cooldown

    const session = await prisma.gameSession.create({
      data: {
        userId,
        questionId,
        startedAt: now,
        cooldownUntil,
      },
    });

    // 4. Return session ID and Question Title (now it's safe)
    const fullQuestion = await QuestionService.getQuestionById(questionId);
    return {
      sessionId: session.id,
      questionTitle: fullQuestion.title,
      startedAt: session.startedAt,
    };
  }

  /**
   * Submits answers for a session and calculates points.
   */
  public async submitSession(userId: string, sessionId: string, submittedAnswers: string[]) {
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

    // 1. Evaluate Answers
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

    // 2. Calculate Score
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

    // 3. Cheat Detection
    let flagSuspicious = false;
    let suspiciousReason = null;
    
    // Her cevap için en az 4 saniye kuralı (Soru toplam cevap sayısı üzerinden)
    const minRequiredTime = question.answerCount * 4;
    
    if (durationSeconds < minRequiredTime) {
      flagSuspicious = true;
      suspiciousReason = `Hızlı tamamlama: ${durationSeconds}s (Gereken: ${minRequiredTime}s)`;
    }

    // 4. Update Session
    const updatedSession = await prisma.gameSession.update({
      where: { id: sessionId },
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

    // 5. Point History (If score > 0)
    if (updatedSession.scoreFinal > 0) {
      await prisma.pointHistory.create({
        data: {
          userId,
          sessionId: updatedSession.id,
          module: question.module,
          isSpecial: question.isSpecial,
          points: updatedSession.scoreFinal,
        },
      });
      
      // Update Redis Leaderboard
      await LeaderboardService.addScore({
        userId,
        score: updatedSession.scoreFinal,
        module: question.module,
        countryCode: session.user.countryCode || undefined,
        isSpecial: question.isSpecial,
        specialEventId: question.specialEventId || undefined,
      });
    }

    return this.getSessionResult(userId, sessionId);
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
   * Applies ad reward multiplier.
   */
  public async applyAdReward(userId: string, sessionId: string) {
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
    }

    return this.getSessionResult(userId, sessionId);
  }

  /**
   * Checks if the user has reached their daily limit.
   */
  private async checkDailyLimit(user: any, module: QuestionModule, isSpecial: boolean) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionCount = await prisma.gameSession.count({
      where: {
        userId: user.id,
        startedAt: { gte: today },
        question: {
          module: module,
          isSpecial: isSpecial,
        },
      },
    });

    const isPremium = user.subscriptionTier === SubscriptionTier.premium;
    
    if (isSpecial) {
      if (sessionCount >= 1) {
        throw new ApiError(409, ErrorCode.DAILY_LIMIT_REACHED, 'Özel etkinlik sorusu limiti doldu.');
      }
      return;
    }

    // Normal modules
    const limit = isPremium ? 2 : 1;
    
    if (sessionCount >= limit) {
      throw new ApiError(409, ErrorCode.DAILY_LIMIT_REACHED, 'Günlük soru limitiniz doldu.');
    }
  }
}

export default new SessionService();
