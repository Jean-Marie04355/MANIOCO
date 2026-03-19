export interface IHasher {
  hash(plainText: string): Promise<string>;
  compare(plainText: string, hashedString: string): Promise<boolean>;
}
