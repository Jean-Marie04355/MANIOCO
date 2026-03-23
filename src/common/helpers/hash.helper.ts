import * as bcrypt from 'bcrypt';

export class HashHelper {
  // Hash a password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare a plain password with a hashed password
  static async comparePassword(password: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(password, hashed);
  }
}