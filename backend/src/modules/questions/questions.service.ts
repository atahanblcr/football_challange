import { PrismaClient, QuestionModule, QuestionStatus } from '@prisma/client';
import { ApiError } from '../../errors/api-error';
import { ErrorCode } from '../../errors/error-codes';
import { prisma } from '../../config/database';

export class QuestionService {
  /**
   * Fetches daily questions assigned for today (UTC+3).
   */
  public async getDailyQuestions() {
    // Today's date in UTC+3 (Istanbul)
    const today = new Date();
    today.setHours(today.getHours() + 3);
    const dateString = today.toISOString().split('T')[0];
    const date = new Date(dateString);

    const assignments = await prisma.dailyQuestionAssignment.findMany({
      where: { date },
      include: {
        question: {
          select: {
            id: true,
            module: true,
            difficulty: true,
            answerCount: true,
            timeLimit: true,
            basePoints: true,
            isSpecial: true,
            specialEventId: true,
          },
        },
      },
    });

    return assignments.map((a) => a.question);
  }

  /**
   * Fetches question metadata by ID.
   * Title is NOT included to prevent cheating before session starts.
   */
  public async getQuestionMeta(id: string) {
    const question = await prisma.question.findUnique({
      where: { id },
      select: {
        id: true,
        module: true,
        difficulty: true,
        answerCount: true,
        timeLimit: true,
        basePoints: true,
        status: true,
        isSpecial: true,
      },
    });

    if (!question) {
      throw new ApiError(404, ErrorCode.NOT_FOUND, 'Soru bulunamadı.');
    }

    if (question.status === QuestionStatus.archived) {
      throw new ApiError(403, ErrorCode.FORBIDDEN, 'Bu soru artık aktif değil.');
    }

    return question;
  }

  /**
   * Fetches full question data including title and answers (for session processing).
   * Should be used internally.
   */
  public async getQuestionById(id: string) {
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        answers: {
          include: {
            entity: true,
          },
        },
      },
    });

    if (!question) {
      throw new ApiError(404, ErrorCode.NOT_FOUND, 'Soru bulunamadı.');
    }

    return question;
  }
}

export default new QuestionService();
