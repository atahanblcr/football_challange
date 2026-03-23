---
name: auth-system
description: Specialized procedural guidance for auth-system in the Football Challenge project.
---

# SKILL: AUTH SYSTEM — JWT, GOOGLE/APPLE OAUTH, REFRESH TOKEN ROTASYONU

> Bu skill dosyası Football Challenge kimlik doğrulama sisteminin
> tam implementasyonunu tanımlar. Backend JWT yönetimi, Google/Apple OAuth akışı,
> refresh token rotasyonu ve Flutter tarafındaki auth akışı burada belirlenir.
> Güvenlik kuralları kesinleşmiştir, değiştirilemez.

---

## 1. JWT UTILITY — BACKEND

```typescript
// src/utils/jwt.util.ts
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string;          // userId
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;          // userId
  jti: string;          // Benzersiz token ID (rotasyon için)
  type: 'refresh';
}

/**
 * Access token üret — 15 dakika geçerli
 */
export function generateAccessToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'access' } satisfies AccessTokenPayload,
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
}

/**
 * Refresh token üret — 30 gün geçerli
 * jti (JWT ID) ile her refresh token benzersiz tanımlanır
 */
export function generateRefreshToken(userId: string): string {
  const jti = crypto.randomUUID();
  return jwt.sign(
    { sub: userId, jti, type: 'refresh' } satisfies RefreshTokenPayload,
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
}

/**
 * Access token doğrula — hata fırlatır (expired, invalid)
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return payload;
}

/**
 * Refresh token doğrula — hata fırlatır
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return payload;
}
```

---

## 2. BCRYPT UTILITY

```typescript
// src/utils/bcrypt.util.ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
```

---

## 3. REFERRAL KOD UTILITY

```typescript
// src/utils/referral-code.util.ts

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Karışıklık yaratanlar çıkarıldı (0,O,I,1)

export function generateReferralCode(): string {
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}
```

---

## 4. AUTH ROUTER

```typescript
// src/modules/auth/auth.router.ts
import { Router } from 'express';
import { rateLimitMiddleware } from '../../middleware/rate-limit.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { AuthController } from './auth.controller';

const router = Router();
const controller = new AuthController();

// Auth rate limit — tüm auth endpoint'lerine uygulanır
router.use(rateLimitMiddleware.auth);

// Google OAuth
router.post('/google', controller.loginWithGoogle);

// Apple Sign In
router.post('/apple', controller.loginWithApple);

// Email / şifre
router.post('/email/register', controller.emailRegister);
router.post('/email/login', controller.emailLogin);

// Token yenileme — kendi rate limit'i
router.post('/refresh', controller.refreshToken);

// Çıkış (auth gerektirir)
router.delete('/logout', authMiddleware, controller.logout);

export { router as authRouter };
```

---

## 5. AUTH SCHEMAS — ZOD

```typescript
// src/modules/auth/auth.schema.ts
import { z } from 'zod';

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, 'Google ID token gerekli'),
});

export const appleLoginSchema = z.object({
  identityToken: z.string().min(1, 'Apple identity token gerekli'),
  authorizationCode: z.string().min(1),
  fullName: z.object({
    givenName: z.string().optional(),
    familyName: z.string().optional(),
  }).optional(),
});

export const emailRegisterSchema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalı')
    .regex(/[A-Z]/, 'En az bir büyük harf')
    .regex(/[0-9]/, 'En az bir rakam'),
});

export const emailLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token gerekli'),
});

export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type AppleLoginInput = z.infer<typeof appleLoginSchema>;
export type EmailRegisterInput = z.infer<typeof emailRegisterSchema>;
export type EmailLoginInput = z.infer<typeof emailLoginSchema>;
```

---

## 6. AUTH CONTROLLER

```typescript
// src/modules/auth/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import {
  googleLoginSchema,
  appleLoginSchema,
  emailRegisterSchema,
  emailLoginSchema,
  refreshTokenSchema,
} from './auth.schema';

export class AuthController {
  private service = new AuthService();

  loginWithGoogle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = googleLoginSchema.parse(req.body);
      const result = await this.service.loginWithGoogle(body.idToken);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  };

  loginWithApple = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = appleLoginSchema.parse(req.body);
      const result = await this.service.loginWithApple(body);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  };

  emailRegister = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = emailRegisterSchema.parse(req.body);
      const result = await this.service.emailRegister(body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  };

  emailLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = emailLoginSchema.parse(req.body);
      const result = await this.service.emailLogin(body);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      const result = await this.service.refreshToken(refreshToken);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.logout(req.user!.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
```

---

## 7. AUTH SERVICE — TAM İMPLEMENTASYON

```typescript
// src/modules/auth/auth.service.ts
import { OAuth2Client } from 'google-auth-library';
import appleSignIn from 'apple-signin-auth';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { ApiError } from '../../errors/api-error';
import { ERROR_CODES } from '../../errors/error-codes';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.util';
import { hashPassword, comparePassword } from '../../utils/bcrypt.util';
import { generateReferralCode } from '../../utils/referral-code.util';
import type { AppleLoginInput, EmailRegisterInput, EmailLoginInput } from './auth.schema';

// Google OAuth istemcisi
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  userId: string;
  isNewUser: boolean;
}

export class AuthService {

  // ─── GOOGLE LOGIN ─────────────────────────────────────────────────

  async loginWithGoogle(idToken: string): Promise<AuthResult> {
    // 1. Google token'ı doğrula
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload?.email) {
      throw new ApiError(400, 'INVALID_GOOGLE_TOKEN', 'Geçersiz Google token');
    }

    const { sub: googleId, email, name } = payload;

    // 2. Kullanıcıyı bul veya oluştur
    const { user, isNewUser } = await this.findOrCreateUser({
      provider: 'google',
      providerId: googleId,
      email,
      displayName: name,
    });

    return this.generateAuthResult(user.id, isNewUser);
  }

  // ─── APPLE LOGIN ──────────────────────────────────────────────────

  async loginWithApple(input: AppleLoginInput): Promise<AuthResult> {
    // 1. Apple identity token'ı doğrula
    const applePayload = await appleSignIn.verifyIdToken(
      input.identityToken,
      {
        audience: process.env.APPLE_BUNDLE_ID,
        ignoreExpiration: false,
      }
    );

    if (!applePayload.sub || !applePayload.email) {
      throw new ApiError(400, 'INVALID_APPLE_TOKEN', 'Geçersiz Apple token');
    }

    const { sub: appleId, email } = applePayload;
    const displayName = input.fullName
      ? `${input.fullName.givenName ?? ''} ${input.fullName.familyName ?? ''}`.trim()
      : undefined;

    // 2. Kullanıcıyı bul veya oluştur
    const { user, isNewUser } = await this.findOrCreateUser({
      provider: 'apple',
      providerId: appleId,
      email,
      displayName: displayName || undefined,
    });

    return this.generateAuthResult(user.id, isNewUser);
  }

  // ─── EMAIL KAYIT ─────────────────────────────────────────────────

  async emailRegister(input: EmailRegisterInput): Promise<AuthResult> {
    // Aynı e-posta ile kayıt var mı?
    const existing = await prisma.user.findFirst({
      where: { email: input.email },
    });

    if (existing) {
      throw ApiError.conflict(
        'EMAIL_ALREADY_EXISTS',
        'Bu e-posta adresi zaten kullanımda'
      );
    }

    const passwordHash = await hashPassword(input.password);
    const referralCode = await this.generateUniqueReferralCode();

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        authProvider: 'email',
        referralCode,
      },
    });

    return this.generateAuthResult(user.id, true);
  }

  // ─── EMAIL GİRİŞ ─────────────────────────────────────────────────

  async emailLogin(input: EmailLoginInput): Promise<AuthResult> {
    const user = await prisma.user.findFirst({
      where: { email: input.email, authProvider: 'email' },
    });

    // Kullanıcı bulunamadı veya şifre yanlış — aynı hata mesajı (güvenlik)
    if (!user || !user.passwordHash) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'E-posta veya şifre hatalı');
    }

    const isValid = await comparePassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'E-posta veya şifre hatalı');
    }

    if (user.isBanned) {
      throw new ApiError(403, ERROR_CODES.ACCOUNT_BANNED, 'Hesabınız askıya alındı');
    }

    // Son giriş tarihini güncelle
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    return this.generateAuthResult(user.id, false);
  }

  // ─── TOKEN YENİLEME ───────────────────────────────────────────────

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // 1. Token'ı doğrula
    let payload: { sub: string; jti: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, ERROR_CODES.TOKEN_EXPIRED, 'Refresh token geçersiz veya süresi dolmuş');
    }

    // 2. Token blacklist kontrolü (kullanılmış mı?)
    const blacklistKey = `blacklist:refresh:${payload.jti}`;
    const isBlacklisted = await redis.get(blacklistKey);
    if (isBlacklisted) {
      // Token çalınmış olabilir — kullanıcıyı çıkart
      await this.revokeAllTokens(payload.sub);
      throw new ApiError(401, 'TOKEN_REUSE_DETECTED', 'Güvenlik ihlali tespit edildi');
    }

    // 3. Kullanıcı hâlâ aktif mi?
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isBanned: true },
    });

    if (!user) throw ApiError.unauthorized();
    if (user.isBanned) {
      throw new ApiError(403, ERROR_CODES.ACCOUNT_BANNED, 'Hesabınız askıya alındı');
    }

    // 4. Eski refresh token'ı blacklist'e al (30 gün TTL)
    await redis.setex(blacklistKey, 30 * 24 * 60 * 60, '1');

    // 5. Yeni token çifti üret (ROTASYON)
    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // ─── ÇIKIŞ ───────────────────────────────────────────────────────

  async logout(userId: string): Promise<void> {
    // Son aktif zamanı güncelle
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });
    // Not: Client tarafında token'lar silinir.
    // Refresh token henüz kullanılmadıysa 30 gün sonra kendiliğinden geçersiz olur.
  }

  // ─── YARDIMCI METODLAR ────────────────────────────────────────────

  private async findOrCreateUser(params: {
    provider: 'google' | 'apple';
    providerId: string;
    email: string;
    displayName?: string;
  }): Promise<{ user: { id: string }; isNewUser: boolean }> {
    const { provider, providerId, email } = params;

    // Önce provider ID ile ara
    let user = await prisma.user.findFirst({
      where: { authProvider: provider, authProviderId: providerId },
      select: { id: true, isBanned: true },
    });

    if (user) {
      if (user.isBanned) {
        throw new ApiError(403, ERROR_CODES.ACCOUNT_BANNED, 'Hesabınız askıya alındı');
      }
      // Son giriş güncelle
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      });
      return { user, isNewUser: false };
    }

    // Aynı e-posta başka provider ile kayıtlı mı?
    const byEmail = await prisma.user.findFirst({ where: { email } });
    if (byEmail) {
      // E-postayı zaten var olan hesaba bağla
      const updated = await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          authProviderId: providerId,
          lastActiveAt: new Date(),
        },
      });
      return { user: updated, isNewUser: false };
    }

    // Yeni kullanıcı oluştur
    const referralCode = await this.generateUniqueReferralCode();
    const newUser = await prisma.user.create({
      data: {
        email,
        authProvider: provider,
        authProviderId: providerId,
        referralCode,
        // Timezone ve countryCode kayıt sırasında girilir, şimdilik boş
      },
    });

    return { user: newUser, isNewUser: true };
  }

  private async generateAuthResult(
    userId: string,
    isNewUser: boolean
  ): Promise<AuthResult> {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);
    return { accessToken, refreshToken, userId, isNewUser };
  }

  private async generateUniqueReferralCode(): Promise<string> {
    // Benzersiz olana kadar dene (çakışma ihtimali çok düşük)
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateReferralCode();
      const exists = await prisma.user.findUnique({
        where: { referralCode: code },
        select: { id: true },
      });
      if (!exists) return code;
    }
    throw new Error('Referral kod üretilemedi');
  }

  private async revokeAllTokens(userId: string): Promise<void> {
    // Tüm aktif session'ları geçersiz kılmak için
    // Basit yaklaşım: kullanıcı versiyon numarasını artır
    // Daha gelişmiş: Redis'te userId → revokedAt timestamp
    await redis.setex(`revoked:user:${userId}`, 30 * 24 * 60 * 60, Date.now().toString());
  }
}
```

---

## 8. ADMIN AUTH — AYRI SİSTEM

```typescript
// src/modules/admin/admins/admin-auth.service.ts
import { prisma } from '../../../config/database';
import { ApiError } from '../../../errors/api-error';
import { hashPassword, comparePassword } from '../../../utils/bcrypt.util';
import { env } from '../../../config/env';
import crypto from 'crypto';

export class AdminAuthService {

  async login(email: string, password: string): Promise<{ sessionToken: string }> {
    const admin = await prisma.adminUser.findUnique({ where: { email } });

    if (!admin) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'E-posta veya şifre hatalı');
    }

    const isValid = await comparePassword(password, admin.passwordHash);
    if (!isValid) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'E-posta veya şifre hatalı');
    }

    // Oturum token'ı oluştur ve Redis'e kaydet (8 saat TTL)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    await import('../../../config/redis').then(({ redis }) =>
      redis.setex(`admin:session:${sessionToken}`, 8 * 60 * 60, admin.id)
    );

    return { sessionToken };
  }

  async logout(sessionToken: string): Promise<void> {
    await import('../../../config/redis').then(({ redis }) =>
      redis.del(`admin:session:${sessionToken}`)
    );
  }
}
```

```typescript
// src/middleware/admin-auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { ApiError } from '../errors/api-error';

declare global {
  namespace Express {
    interface Request {
      adminUser?: { id: string; role: string; email: string };
    }
  }
}

export async function adminAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    // Session token cookie'den veya header'dan al
    const sessionToken =
      req.cookies?.['admin_session'] ??
      req.headers['x-admin-session'];

    if (!sessionToken || typeof sessionToken !== 'string') {
      throw ApiError.unauthorized('ADMIN_UNAUTHORIZED');
    }

    // Redis'te doğrula
    const adminId = await redis.get(`admin:session:${sessionToken}`);
    if (!adminId) {
      throw ApiError.unauthorized('ADMIN_SESSION_EXPIRED');
    }

    // Admin bilgilerini çek
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { id: true, role: true, email: true, isActive: true },
    });

    if (!admin || !admin.isActive) {
      throw ApiError.unauthorized('ADMIN_NOT_FOUND');
    }

    req.adminUser = admin;
    next();
  } catch (err) {
    next(err);
  }
}
```

```typescript
// src/middleware/rbac.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/api-error';

type AdminRole = 'super_admin' | 'editor' | 'moderator';

const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 3,
  editor: 2,
  moderator: 1,
};

/**
 * Minimum rol seviyesi kontrolü
 * requireRole('editor') → editor veya super_admin geçer
 */
export function requireRole(minRole: AdminRole) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userRole = req.adminUser?.role as AdminRole;
    if (!userRole) {
      return next(ApiError.unauthorized());
    }

    const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minRole];

    if (userLevel < requiredLevel) {
      return next(ApiError.forbidden('INSUFFICIENT_ROLE'));
    }

    next();
  };
}

// Kısayollar
export const requireSuperAdmin = requireRole('super_admin');
export const requireEditor     = requireRole('editor');
export const requireModerator  = requireRole('moderator');
```

---

## 9. FLUTTER — AUTH REPOSITORY

```dart
// lib/features/auth/data/auth_repository.dart
import 'package:dio/dio.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/errors/app_exception.dart';
import '../domain/auth_model.dart';

class AuthRepository {
  final Dio _dio;

  AuthRepository(this._dio);

  // ─── GOOGLE ─────────────────────────────────────────────────────

  Future<AuthResult> loginWithGoogle() async {
    // 1. Google Sign-In akışını başlat
    final googleSignIn = GoogleSignIn(
      scopes: ['email', 'profile'],
    );

    final googleUser = await googleSignIn.signIn();
    if (googleUser == null) {
      throw const AppException(code: 'CANCELLED', message: 'Google girişi iptal edildi');
    }

    final googleAuth = await googleUser.authentication;
    final idToken = googleAuth.idToken;
    if (idToken == null) {
      throw const AppException(code: 'NO_ID_TOKEN', message: 'Google ID token alınamadı');
    }

    // 2. Backend'e gönder
    try {
      final response = await _dio.post(
        ApiEndpoints.googleLogin,
        data: {'idToken': idToken},
      );
      return AuthResult.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }

  // ─── APPLE ──────────────────────────────────────────────────────

  Future<AuthResult> loginWithApple() async {
    // 1. Apple Sign-In akışını başlat
    final credential = await SignInWithApple.getAppleIDCredential(
      scopes: [
        AppleIDAuthorizationScopes.email,
        AppleIDAuthorizationScopes.fullName,
      ],
    );

    // 2. Backend'e gönder
    try {
      final response = await _dio.post(
        ApiEndpoints.appleLogin,
        data: {
          'identityToken': credential.identityToken,
          'authorizationCode': credential.authorizationCode,
          'fullName': {
            'givenName': credential.givenName,
            'familyName': credential.familyName,
          },
        },
      );
      return AuthResult.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }

  // ─── EMAIL ──────────────────────────────────────────────────────

  Future<AuthResult> emailRegister({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.emailRegister,
        data: {'email': email, 'password': password},
      );
      return AuthResult.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }

  Future<AuthResult> emailLogin({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.emailLogin,
        data: {'email': email, 'password': password},
      );
      return AuthResult.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }

  // ─── TOKEN YENİLEME ─────────────────────────────────────────────

  Future<TokenPair> refreshToken(String refreshToken) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.tokenRefresh,
        data: {'refreshToken': refreshToken},
      );
      return TokenPair.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }

  // ─── ÇIKIŞ ──────────────────────────────────────────────────────

  Future<void> logout() async {
    try {
      await _dio.delete(ApiEndpoints.logout);
    } catch (_) {
      // Logout hatası görmezden gelinir — client token'ları zaten silinir
    }
  }

  // ─── ME ─────────────────────────────────────────────────────────

  Future<UserProfile> getMe() async {
    try {
      final response = await _dio.get(ApiEndpoints.me);
      return UserProfile.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }
}
```

---

## 10. FLUTTER — AUTH DOMAIN MODELLERİ

```dart
// lib/features/auth/domain/auth_model.dart

class AuthResult {
  final String accessToken;
  final String refreshToken;
  final String userId;
  final bool isNewUser;

  const AuthResult({
    required this.accessToken,
    required this.refreshToken,
    required this.userId,
    required this.isNewUser,
  });

  factory AuthResult.fromJson(Map<String, dynamic> json) {
    return AuthResult(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      userId: json['userId'] as String,
      isNewUser: json['isNewUser'] as bool,
    );
  }
}

class TokenPair {
  final String accessToken;
  final String refreshToken;

  const TokenPair({required this.accessToken, required this.refreshToken});

  factory TokenPair.fromJson(Map<String, dynamic> json) {
    return TokenPair(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
    );
  }
}

class UserProfile {
  final String id;
  final String nickname;
  final String? countryCode;
  final int? avatarIndex;
  final bool isBanned;
  final String subscriptionTier;

  const UserProfile({
    required this.id,
    required this.nickname,
    this.countryCode,
    this.avatarIndex,
    required this.isBanned,
    required this.subscriptionTier,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String,
      nickname: json['nickname'] as String? ?? '',
      countryCode: json['countryCode'] as String?,
      avatarIndex: json['avatarIndex'] as int?,
      isBanned: json['isBanned'] as bool? ?? false,
      subscriptionTier: json['subscriptionTier'] as String? ?? 'free',
    );
  }
}
```

---

## 11. AUTH TESTLERİ — BACKEND

```typescript
// tests/auth/token-refresh.test.ts
import request from 'supertest';
import app from '../../src/app';
import { generateRefreshToken, generateAccessToken } from '../../src/utils/jwt.util';
import { redis } from '../../src/config/redis';
import { prisma } from '../../src/config/database';

describe('POST /api/v1/auth/refresh', () => {
  let userId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        nickname: 'TestRefresh',
        authProvider: 'email',
        email: 'refresh@test.com',
        referralCode: 'TESTREF123',
      },
    });
    userId = user.id;
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { email: 'refresh@test.com' } });
    const keys = await redis.keys('blacklist:refresh:*');
    if (keys.length > 0) await redis.del(...keys);
  });

  it('geçerli refresh token → yeni token çifti döner', async () => {
    const refreshToken = generateRefreshToken(userId);

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
    // Yeni refresh token eskisinden farklı olmalı (rotasyon)
    expect(res.body.data.refreshToken).not.toBe(refreshToken);
  });

  it('aynı refresh token iki kez kullanılırsa güvenlik ihlali', async () => {
    const refreshToken = generateRefreshToken(userId);

    // İlk kullanım — başarılı
    await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    // İkinci kullanım — reddedilmeli
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_REUSE_DETECTED');
  });

  it('geçersiz imzalı token 401 döner', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid.token.here' });

    expect(res.status).toBe(401);
  });

  it('access token refresh endpoint\'inde 401 döner', async () => {
    const accessToken = generateAccessToken(userId);

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: accessToken }); // Yanlış token tipi

    expect(res.status).toBe(401);
  });

  it('refresh token eksik → 400 döner', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

---

## 12. GÜVENLİK KONTROL LİSTESİ

Her auth implementasyonunda aşağıdakiler kontrol edilir:

```
✓ Access token süresi: 15 dakika
✓ Refresh token süresi: 30 gün
✓ Refresh token rotasyonu: Her kullanımda yeni token üretilir
✓ Eski refresh token blacklist'e alınır (Redis, 30 gün TTL)
✓ Token yeniden kullanımı tespit edilirse tüm oturumlar iptal edilir
✓ Ban kontrolü: her auth endpoint'inde yapılır
✓ E-posta/şifre hatası: tek tip mesaj (hangi alanın yanlış olduğu belirtilmez)
✓ Şifre min. 8 karakter, 1 büyük harf, 1 rakam
✓ bcrypt SALT_ROUNDS = 12
✓ Admin oturumu JWT değil, opak session token (Redis, 8 saat TTL)
✓ Admin ve kullanıcı auth sistemi tamamen ayrıdır
✓ RBAC: super_admin > editor > moderator (hiyerarşik)
✓ Google token sunucu tarafında doğrulanır (client doğrulamasına güvenilmez)
✓ Apple token sunucu tarafında doğrulanır
```

---

## 13. KESİNLİKLE YAPILMAYACAKLAR

- Access token süresi 15 dakikadan uzun yapılmaz.
- Refresh token rotasyonu atlanamaz — her `/auth/refresh` çağrısında yeni çift üretilir.
- Şifre DB'ye plain text kaydedilmez. Her zaman bcrypt hash.
- Google/Apple token'ı sadece client'ta doğrulanmaz. Backend'de her zaman verify edilir.
- Admin JWT kullanmaz — opak session token + Redis kullanır.
- Ban kontrolü sadece middleware'de değil, login/register endpoint'lerinde de yapılır.
- `userId` veya `email` başka kullanıcıya ait olmak üzere response'a eklenmez.
- Token blacklist TTL'i refresh token süresinden kısa yapılmaz (30 gün minimum).
