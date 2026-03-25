// tests/unit/api-error.test.ts
import { ApiError } from '../../src/errors/api-error';
import { ErrorCode } from '../../src/errors/error-codes';

describe('ApiError', () => {
  it('should create a badRequest error', () => {
    const error = ApiError.badRequest(ErrorCode.VALIDATION_ERROR, 'Hatalı veri');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.message).toBe('Hatalı veri');
  });

  it('should create an unauthorized error', () => {
    const error = ApiError.unauthorized();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
  });

  it('should create a notFound error', () => {
    const error = ApiError.notFound('Kullanıcı');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Kullanıcı bulunamadı');
  });
});
