import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IHasher } from '../interfaces/hasher.interface';

@Injectable()
export class BcryptHasherProvider implements IHasher {
  private readonly saltRounds = 10;

  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.saltRounds);
  }

  async compare(plainText: string, hashedString: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashedString);
  }
}
