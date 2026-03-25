// src/utils/bcrypt.util.ts
import bcrypt from 'bcryptjs';

export const bcryptUtil = {
  hash: async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },
  compare: async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
  }
};
