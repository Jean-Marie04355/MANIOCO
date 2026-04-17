import * as bcrypt from 'bcrypt';
import { hashPassword, comparePassword } from './hash.helper';

describe('HashHelper', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const pwd = 'test';
      const hash = await hashPassword(pwd);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(pwd);
      const isMatch = await bcrypt.compare(pwd, hash);
      expect(isMatch).toBe(true);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const pwd = 'test';
      const hash = await bcrypt.hash(pwd, 10);
      const isMatch = await comparePassword(pwd, hash);
      expect(isMatch).toBe(true);
    });

    it('should return false for different passwords', async () => {
      const hash = await bcrypt.hash('test', 10);
      const isMatch = await comparePassword('wrong', hash);
      expect(isMatch).toBe(false);
    });
  });
});
