// src/middleware/cheat-detect.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../errors/api-error';

/**
 * Basit hile tespiti.
 * submitted_at - started_at < answer_count * 4s kontrolü yapar.
 * Bu kontrol submit endpoint'inde çalışır.
 */
export const cheatDetectMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.params;
  const user = (req as any).user;

  if (!sessionId || !user) {
    return next();
  }

  try {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { question: { select: { answerCount: true } } }
    });

    if (!session || session.userId !== user.id) {
      return next();
    }

    const startTime = session.startedAt.getTime();
    const submitTime = Date.now();
    const durationSeconds = (submitTime - startTime) / 1000;
    
    // Her cevap için en az 4 saniye kuralı (Örn: 10 cevap için min 40 saniye)
    const minRequiredTime = session.question.answerCount * 4;

    if (durationSeconds < minRequiredTime) {
      // Puan verilir ama flag atılır. Flag işlemi submit controller'ında yapılacağı için
      // burada sadece request nesnesine işaret bırakıyoruz.
      (req as any).isSuspicious = true;
      (req as any).suspiciousReason = `Hızlı tamamlama: ${durationSeconds.toFixed(1)}s (Gereken: ${minRequiredTime}s)`;
    }

    next();
  } catch (error) {
    next(error);
  }
};
