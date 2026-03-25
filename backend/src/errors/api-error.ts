// src/errors/api-error.ts
import { ErrorCode } from './error-codes';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: any;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(code: ErrorCode, message: string, details?: any) {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(code: ErrorCode = ErrorCode.UNAUTHORIZED, message: string = 'Yetkisiz erişim') {
    return new ApiError(401, code, message);
  }

  static forbidden(message: string = 'Bu işlem için yetkiniz yok') {
    return new ApiError(403, ErrorCode.FORBIDDEN, message);
  }

  static notFound(resource: string = 'Kaynak') {
    return new ApiError(404, ErrorCode.NOT_FOUND, `${resource} bulunamadı`);
  }

  static conflict(code: ErrorCode, message: string) {
    return new ApiError(409, code, message);
  }

  static internal(message: string = 'Bir sunucu hatası oluştu') {
    return new ApiError(500, ErrorCode.INTERNAL_ERROR, message);
  }
}
