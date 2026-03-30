// src/modules/users/users.service.ts
import { prisma } from '../../config/database';
import { ApiError } from '../../errors/api-error';
import { ErrorCode } from '../../errors/error-codes';
import { redis } from '../../config/redis';

export class UsersService {
  /**
   * Giriş yapmış kullanıcının profil bilgilerini döner.
   */
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        email: true,
        avatarIndex: true,
        countryCode: true,
        subscriptionTier: true,
        referralCode: true,
        lastActiveAt: true,
        createdAt: true,
      }
    });

    if (!user) throw ApiError.notFound('Kullanıcı');
    return user;
  }

  /**
   * Kullanıcı bilgilerini günceller.
   * Nickname değişirse cooldown kontrolü yapılabilir (İsteğe bağlı).
   */
  async updateMe(userId: string, data: any) {
    const { nickname, avatarIndex, countryCode, fcmToken, pushNotificationsEnabled } = data;

    if (nickname) {
      const existing = await prisma.user.findFirst({
        where: { nickname, NOT: { id: userId } }
      });
      if (existing) throw ApiError.conflict(ErrorCode.NICKNAME_TAKEN, 'Bu nickname zaten alınmış');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        nickname,
        avatarIndex,
        countryCode,
        fcmToken,
        pushNotificationsEnabled,
        nicknameChangedAt: nickname ? new Date() : undefined,
      },
      select: { id: true, nickname: true, avatarIndex: true, countryCode: true, pushNotificationsEnabled: true }
    });

    return user;
  }

  /**
   * Nickname müsaitlik kontrolü yapar.
   */
  async isNicknameAvailable(nickname: string) {
    const user = await prisma.user.findUnique({ where: { nickname } });
    return { available: !user };
  }

  /**
   * Kullanıcının geçmiş leaderboard snapshot'larını döner.
   */
  async getHistory(userId: string) {
    // Bu bölüm ileride leaderboard_snapshots tablosuyla geliştirilecek.
    // Şimdilik boş bir liste dönüyoruz.
    return [];
  }

  /**
   * Hesabı ve ilgili tüm verileri siler.
   */
  async deleteAccount(userId: string) {
    // Redis'teki tüm leaderboard verilerinden kullanıcıyı temizlemek gerekir.
    // Bu işlem arka planda veya bir kuyrukla yapılabilir.
    // Şimdilik sadece DB silme işlemi yapıyoruz.
    
    await prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }
}
