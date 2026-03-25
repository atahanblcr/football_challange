// tests/unit/jwt.test.ts
import { jwtUtil } from '../../src/utils/jwt.util';

describe('JwtUtil', () => {
  const payload = { userId: 'user-123', role: 'admin' };

  it('should generate and verify access token', () => {
    const token = jwtUtil.generateAccessToken(payload);
    expect(token).toBeDefined();

    const decoded = jwtUtil.verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
  });

  it('should generate and verify refresh token', () => {
    const token = jwtUtil.generateRefreshToken(payload);
    expect(token).toBeDefined();

    const decoded = jwtUtil.verifyRefreshToken(token);
    expect(decoded.userId).toBe(payload.userId);
  });
});
