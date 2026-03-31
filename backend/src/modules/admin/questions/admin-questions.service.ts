// src/modules/admin/questions/admin-questions.service.ts
import { prisma } from '../../../config/database';
import { Difficulty, QuestionModule, QuestionStatus, Prisma } from '@prisma/client';
import { ApiError } from '../../../errors/api-error';

export const adminQuestionsService = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    module?: QuestionModule;
    status?: QuestionStatus;
    search?: string;
  }) => {
    const { page = 1, limit = 20, module, status, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.QuestionWhereInput = {
      ...(module ? { module } : {}),
      ...(status ? { status } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { gameSessions: true } }
        }
      }),
      prisma.question.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getById: async (id: string) => {
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        answers: {
          include: { entity: { select: { name: true, countryCode: true } } },
          orderBy: { rank: 'asc' }
        }
      }
    });

    if (!question) throw ApiError.notFound('Soru bulunamadı');
    return question;
  },

  getPoolHealth: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const available = await prisma.question.groupBy({
      by: ['module'],
      where: {
        status: QuestionStatus.active,
        isSpecial: false,
        dailyAssignments: {
          none: { date: { gte: today } }
        }
      },
      _count: { id: true }
    });

    const result: Record<string, number> = {
      players: 0,
      clubs: 0,
      nationals: 0,
      managers: 0
    };

    available.forEach(row => {
      result[row.module] = row._count.id;
    });

    return Object.entries(result).map(([module, count]) => ({
      module,
      count,
      label: module.charAt(0).toUpperCase() + module.slice(1) // Simple label
    }));
  },

  getCalendar: async (month?: number, year?: number) => {
    const now = new Date();
    const targetMonth = month !== undefined ? month - 1 : now.getMonth();
    const targetYear = year !== undefined ? year : now.getFullYear();

    // UTC başlangıç ve bitiş tarihlerini ayarla
    const startDate = new Date(Date.UTC(targetYear, targetMonth, 1));
    const endDate = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59, 999));

    const assignments = await prisma.dailyQuestionAssignment.findMany({
      where: {
        date: { gte: startDate, lte: endDate }
      },
      include: {
        question: { select: { id: true, title: true, module: true, status: true } }
      }
    });

    return assignments;
  },

  create: async (data: any) => {
    const { answers, ...questionData } = data;

    // specialEventId boş string ise null yap (Foreign Key hatasını önlemek için)
    if (questionData.specialEventId === "") {
      questionData.specialEventId = null;
    }

    return prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          ...questionData,
          answerCount: answers.length,
          answers: {
            create: answers.map((a: any) => ({
              entityId: a.entityId,
              rank: a.rank,
              statValue: a.statValue,
              statDisplay: a.statDisplay
            }))
          }
        },
        include: { answers: true }
      });

      // Eğer tarih (scheduledFor) belirtilmişse, DailyQuestionAssignment'a da ekle
      if (questionData.scheduledFor) {
        // ISO string veya tarih dizesinden sadece YYYY-MM-DD kısmını al
        const datePart = typeof questionData.scheduledFor === 'string' 
          ? questionData.scheduledFor.split('T')[0] 
          : new Date(questionData.scheduledFor).toISOString().split('T')[0];

        const [year, month, day] = datePart.split('-').map(Number);
        const scheduledDate = new Date(Date.UTC(year, month - 1, day));

        await tx.dailyQuestionAssignment.upsert({
          where: {
            date_module_isExtra: {
              date: scheduledDate,
              module: question.module,
              isExtra: false,
            }
          },
          update: { questionId: question.id },
          create: {
            date: scheduledDate,
            module: question.module,
            questionId: question.id,
            isExtra: false,
          }
        });
      }

      return question;
    });
  },

  update: async (id: string, data: any) => {
    const { answers, ...questionData } = data;

    // specialEventId boş string ise null yap (Foreign Key hatasını önlemek için)
    if (questionData.specialEventId === "") {
      questionData.specialEventId = null;
    }

    return prisma.$transaction(async (tx) => {
      // Önce mevcut cevapları sil
      if (answers) {
        await tx.questionAnswer.deleteMany({ where: { questionId: id } });
      }

      const question = await tx.question.update({
        where: { id },
        data: {
          ...questionData,
          ...(answers ? {
            answerCount: answers.length,
            answers: {
              create: answers.map((a: any) => ({
                entityId: a.entityId,
                rank: a.rank,
                statValue: a.statValue,
                statDisplay: a.statDisplay
              }))
            }
          } : {})
        },
        include: { answers: true }
      });

      // Eğer tarih (scheduledFor) belirtilmişse veya güncellenmişse, DailyQuestionAssignment'ı da güncelle
      if (questionData.scheduledFor) {
        // ISO string veya tarih dizesinden sadece YYYY-MM-DD kısmını al
        const datePart = typeof questionData.scheduledFor === 'string' 
          ? questionData.scheduledFor.split('T')[0] 
          : new Date(questionData.scheduledFor).toISOString().split('T')[0];

        const [year, month, day] = datePart.split('-').map(Number);
        const scheduledDate = new Date(Date.UTC(year, month - 1, day));

        await tx.dailyQuestionAssignment.upsert({
          where: {
            date_module_isExtra: {
              date: scheduledDate,
              module: question.module,
              isExtra: false,
            }
          },
          update: { questionId: question.id },
          create: {
            date: scheduledDate,
            module: question.module,
            questionId: question.id,
            isExtra: false,
          }
        });
      }

      return question;
    });
  },

  archive: async (id: string) => {
    const activeSessionCount = await prisma.gameSession.count({
      where: {
        questionId: id,
        submittedAt: null,
        startedAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } // 15 dk
      }
    });

    if (activeSessionCount > 0) {
      await prisma.question.update({
        where: { id },
        data: { status: QuestionStatus.archiving }
      });
      return QuestionStatus.archiving;
    }

    await prisma.question.update({
      where: { id },
      data: { status: QuestionStatus.archived, archivedAt: new Date() }
    });
    return QuestionStatus.archived;
  }
};
