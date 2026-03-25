// src/modules/auth/auth.service.ts
import { prisma } from '../../config/database';
import { bcryptUtil } from '../../utils/bcrypt.util';
import { jwtUtil } from '../../utils/jwt.util';
import { referralCodeUtil } from '../../utils/referral-code.util';
import { ApiError } from '../../errors/api-error';
import { ErrorCode } from '../../errors/error-codes';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export class AuthService {
  /**
   * E-posta ile yeni kullanıcı kaydı oluşturur.
   */
  async register(data: any) {
    const { email, password, nickname, referredByCode } = data;

    // Email ve Nickname kontrolü
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { nickname }] }
    });

    if (existingUser) {
      if (existingUser.email === email) throw ApiError.conflict(ErrorCode.EMAIL_TAKEN, 'E-posta adresi zaten kullanımda');
      if (existingUser.nickname === nickname) throw ApiError.conflict(ErrorCode.NICKNAME_TAKEN, 'Bu nickname zaten alınmış');
    }

    const passwordHash = await bcryptUtil.hash(password);
    const referralCode = referralCodeUtil.generate();

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        nickname,
        referralCode,
        referredByCode,
        authProvider: 'email',
      },
      select: { id: true, nickname: true, email: true }
    });

    const accessToken = jwtUtil.generateAccessToken({ userId: user.id });
    const refreshToken = jwtUtil.generateRefreshToken({ userId: user.id });

    return { user, accessToken, refreshToken };
  }

  /**
   * E-posta ve şifre ile giriş yapar.
   */
  async login(data: any) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw ApiError.unauthorized(ErrorCode.INVALID_CREDENTIALS, 'Geçersiz e-posta veya şifre');
    }

    const isPasswordMatch = await bcryptUtil.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      throw ApiError.unauthorized(ErrorCode.INVALID_CREDENTIALS, 'Geçersiz e-posta veya şifre');
    }

    if (user.isBanned) throw ApiError.forbidden('Hesabınız askıya alınmıştır');

    const accessToken = jwtUtil.generateAccessToken({ userId: user.id });
    const refreshToken = jwtUtil.generateRefreshToken({ userId: user.id });

    return {
      user: { id: user.id, nickname: user.nickname, email: user.email },
      accessToken,
      refreshToken
    };
  }

  /**
   * Google ID Token ile giriş veya kayıt yapar.
   */
  async googleLogin(idToken: string) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) throw ApiError.unauthorized(ErrorCode.INVALID_CREDENTIALS, 'Google doğrulama başarısız');

      let user = await prisma.user.findUnique({ where: { email: payload.email } });

      if (!user) {
        // Yeni kullanıcı (OAuth ile kayıt)
        const referralCode = referralCodeUtil.generate();
        // Geçici bir nickname ata, kullanıcı sonra değiştirmeli
        const tempNickname = `user_${Math.random().toString(36).substring(2, 8)}`;
        
        user = await prisma.user.create({
          data: {
            email: payload.email,
            nickname: tempNickname,
            referralCode,
            authProvider: 'google',
            authProviderId: payload.sub,
          }
        });
      }

      if (user.isBanned) throw ApiError.forbidden('Hesabınız askıya alınmıştır');

      const accessToken = jwtUtil.generateAccessToken({ userId: user.id });
      const refreshToken = jwtUtil.generateRefreshToken({ userId: user.id });

      return {
        user: { id: user.id, nickname: user.nickname, email: user.email },
        accessToken,
        refreshToken,
        isNewUser: !user.nicknameChangedAt // Nickname hiç değişmediyse yeni sayılır
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.unauthorized(ErrorCode.INVALID_CREDENTIALS, 'Google Login başarısız');
    }
  }

  /**
   * Refresh Token kullanarak yeni Access Token üretir.
   */
  async refresh(refreshToken: string) {
    try {
      const decoded = jwtUtil.verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

      if (!user || user.isBanned) throw ApiError.unauthorized();

      const newAccessToken = jwtUtil.generateAccessToken({ userId: user.id });
      const newRefreshToken = jwtUtil.generateRefreshToken({ userId: user.id });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw ApiError.unauthorized(ErrorCode.TOKEN_EXPIRED, 'Oturum süresi doldu, lütfen tekrar giriş yapın');
    }
  }
}
