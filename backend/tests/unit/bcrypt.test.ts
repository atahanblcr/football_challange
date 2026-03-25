// tests/unit/bcrypt.test.ts
import { bcryptUtil } from '../../src/utils/bcrypt.util';

describe('BcryptUtil', () => {
  const password = 'secret-password';

  it('should hash a password and compare correctly', async () => {
    const hash = await bcryptUtil.hash(password);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);

    const isMatch = await bcryptUtil.compare(password, hash);
    expect(isMatch).toBe(true);
  });

  it('should return false for incorrect password', async () => {
    const hash = await bcryptUtil.hash(password);
    const isMatch = await bcryptUtil.compare('wrong-password', hash);
    expect(isMatch).toBe(false);
  });
});
