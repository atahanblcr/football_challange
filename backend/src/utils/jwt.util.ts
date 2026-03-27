// src/utils/jwt.util.ts
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
  userId: string;
  role?: string;
}

interface AdminTokenPayload {
  adminId: string;
  role: string;
}

export const jwtUtil = {
  generateAccessToken: (payload: TokenPayload): string => {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn']
    });
  },

  generateRefreshToken: (payload: TokenPayload): string => {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn']
    });
  },

  verifyAccessToken: (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  },

  verifyRefreshToken: (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  },

  generateAdminSessionToken: (payload: AdminTokenPayload): string => {
    return jwt.sign(payload, env.ADMIN_SESSION_SECRET, {
      expiresIn: '24h' // Admin session lasts 24 hours
    });
  },

  verifyAdminSessionToken: (token: string): AdminTokenPayload => {
    return jwt.verify(token, env.ADMIN_SESSION_SECRET) as AdminTokenPayload;
  }
};
