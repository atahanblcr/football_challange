// src/modules/admin/questions/admin-questions.service.ts
import { prisma } from '../../../config/database';
import { Difficulty, QuestionModule, QuestionStatus, Prisma } from '@prisma/client';
import { ApiError } from '../../../errors/api-error';
import { ErrorCode } from '../../../errors/error-codes';

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
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        question: { select: { id: true, title: true, module: true, status: true, isSpecial: true } }
      },
      orderBy: { date: 'asc' }
    });

    return assignments.map(a => ({
      ...a,
      // Date nesnesini YYYY-MM-DD formatında string'e dönüştürerek frontend'e gönderelim
      // Bu sayede timezone karmaşası önlenir.
      date: a.date.toISOString().split('T')[0],
      isSpecial: a.isSpecial,
      isExtra: a.isExtra,
    }));
  },

  getAssignmentsByDate: async (dateStr: string) => {
    // dateStr: YYYY-MM-DD formatında gelir.
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    const assignments = await prisma.dailyQuestionAssignment.findMany({
      where: { date },
      include: {
        question: { select: { id: true, title: true, module: true, status: true, isSpecial: true } }
      }
    });

    return assignments.map(a => ({
      ...a,
      date: a.date.toISOString().split('T')[0]
    }));
  },

  prefillAssignments: async (daysToPrefill: number = 30) => {
    const modules: QuestionModule[] = ['players', 'clubs', 'nationals', 'managers'];
    const results = [];

    // Mevcut tarih UTC+3 Istanbul'a göre ayarlanmalı ama server UTC olduğu için 
    // bugünün tarihini UTC 00:00:00 olarak alalım.
    const now = new Date();
    const [yearNow, monthNow, dayNow] = now.toISOString().split('T')[0].split('-').map(Number);
    const startDate = new Date(Date.UTC(yearNow, monthNow - 1, dayNow));

    for (let i = 0; i < daysToPrefill; i++) {
      const scheduledDate = new Date(startDate);
      scheduledDate.setUTCDate(startDate.getUTCDate() + i);
      const dateStr = scheduledDate.toISOString().split('T')[0];

      for (const module of modules) {
        // 1. Zaten seçilmiş mi kontrol et
        const existing = await prisma.dailyQuestionAssignment.findUnique({
          where: {
            date_module_isExtra_isSpecial: {
              date: scheduledDate,
              module: module,
              isExtra: false,
              isSpecial: false,
            }
          }
        });

        if (existing) continue;

        // 2. Havuzdan uygun bir soru seç
        const questionId = await adminQuestionsService.findEligibleQuestion(module, scheduledDate, false);

        if (questionId) {
          await prisma.$transaction([
            prisma.dailyQuestionAssignment.create({
              data: {
                date: scheduledDate,
                module: module,
                questionId: questionId,
              }
            }),
            prisma.question.update({
              where: { id: questionId },
              data: { lastShownAt: scheduledDate }
            })
          ]);
          results.push({ date: dateStr, module, questionId });
        }
      }
    }
    return results;
  },

  assignManual: async (dateStr: string, module: QuestionModule, questionId: string, isSpecial: boolean = false) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const scheduledDate = new Date(Date.UTC(year, month - 1, day));

    return prisma.$transaction(async (tx) => {
      const assignment = await tx.dailyQuestionAssignment.upsert({
        where: {
          date_module_isExtra_isSpecial: {
            date: scheduledDate,
            module,
            isExtra: false,
            isSpecial,
          }
        },
        update: { questionId },
        create: {
          date: scheduledDate,
          module,
          questionId,
          isSpecial,
        }
      });

      await tx.question.update({
        where: { id: questionId },
        data: { lastShownAt: scheduledDate }
      });

      return assignment;
    });
  },

  assignRandom: async (dateStr: string, module: QuestionModule, isSpecial: boolean = false) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const scheduledDate = new Date(Date.UTC(year, month - 1, day));

    // Eğer o gün zaten bir atama varsa, o soruyu havuzdan hariç tutalım ki aynısı gelmesin
    const existing = await prisma.dailyQuestionAssignment.findUnique({
      where: {
        date_module_isExtra_isSpecial: {
          date: scheduledDate,
          module,
          isExtra: false,
          isSpecial,
        }
      }
    });

    const questionId = await adminQuestionsService.findEligibleQuestion(module, scheduledDate, isSpecial, existing?.questionId);
    if (!questionId) {
      throw ApiError.badRequest(ErrorCode.NOT_FOUND, `Bu modül için havuzda uygun soru bulunamadı: ${module}${isSpecial ? ' (Özel Etkinlik)' : ''}. Lütfen aktif soru sayısını kontrol edin.`);
    }

    return adminQuestionsService.assignManual(dateStr, module, questionId, isSpecial);
  },

  findEligibleQuestion: async (module: QuestionModule, date: Date, isSpecial: boolean = false, currentQuestionId?: string) => {
    // Kademeli olarak pencereyi daraltalım: 90 gün -> 30 gün -> 0 gün
    const windows = [90, 30, 0];

    for (const days of windows) {
      const startDate = new Date(date);
      startDate.setDate(startDate.getDate() - days);
      
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + days);

      // 1. Pencere içindeki atamaları bul
      const assignedInWindow = await prisma.dailyQuestionAssignment.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        select: { questionId: true }
      });
      
      const excludedIds = assignedInWindow.map(a => a.questionId);
      if (currentQuestionId) {
        if (!excludedIds.includes(currentQuestionId)) excludedIds.push(currentQuestionId);
      }

      // 2. Havuzdan uygun bir soru seç
      // ÖNEMLİ: SQL'de NOT (tarih_aralığı) NULL değerleri de eler. 
      // Bu yüzden NULL olanları (hiç gösterilmemiş) açıkça dahil etmeliyiz.
      const pool = await prisma.question.findMany({
        where: {
          module: module,
          status: QuestionStatus.active,
          isSpecial: isSpecial,
          id: { notIn: excludedIds },
          OR: [
            { lastShownAt: null },
            {
              NOT: {
                lastShownAt: {
                  gte: startDate,
                  lte: endDate
                }
              }
            }
          ]
        },
        select: { id: true }
      });

      if (pool.length > 0) {
        return pool[Math.floor(Math.random() * pool.length)].id;
      }
    }

    return null;
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
            date_module_isExtra_isSpecial: {
              date: scheduledDate,
              module: question.module,
              isExtra: false,
              isSpecial: question.isSpecial,
            }
          },
          update: { questionId: question.id },
          create: {
            date: scheduledDate,
            module: question.module,
            questionId: question.id,
            isExtra: false,
            isSpecial: question.isSpecial,
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
            date_module_isExtra_isSpecial: {
              date: scheduledDate,
              module: question.module,
              isExtra: false,
              isSpecial: question.isSpecial,
            }
          },
          update: { questionId: question.id },
          create: {
            date: scheduledDate,
            module: question.module,
            questionId: question.id,
            isExtra: false,
            isSpecial: question.isSpecial,
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
