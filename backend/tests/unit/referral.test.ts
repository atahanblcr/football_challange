// tests/unit/referral.test.ts
import { referralCodeUtil } from '../../src/utils/referral-code.util';

describe('ReferralCodeUtil', () => {
  it('should generate a code starting with FC-', () => {
    const code = referralCodeUtil.generate();
    expect(code).toMatch(/^FC-[A-Z2-9]{6}$/);
  });

  it('should generate unique codes', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(referralCodeUtil.generate());
    }
    expect(codes.size).toBe(100);
  });
});
