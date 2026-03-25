// src/utils/referral-code.util.ts
import crypto from 'crypto';

export const referralCodeUtil = {
  /**
   * 8 karakterli, okunaklı, benzersiz bir referral kodu üretir.
   * Örnek: FC-X8A2B
   */
  generate: (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Okunabilir karakterler (0, 1, I, O hariç)
    let code = '';
    const randomBytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      code += chars[randomBytes[i] % chars.length];
    }
    return `FC-${code}`;
  }
};
