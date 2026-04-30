import { MongoMemoryServer } from 'mongodb-memory-server';

class E2EState {
  private static _mongod?: MongoMemoryServer;
  public static get mongod(): MongoMemoryServer | undefined {
    return this._mongod;
  }
  public static async init(): Promise<string> {
    this._mongod = await MongoMemoryServer.create();
    return this._mongod.getUri();
  }
}

beforeAll(async () => {
  // Setup MongoDB Memory Server if needed
  if (process.env.DB_TYPE === 'mongodb') {
    const uri = await E2EState.init();
    process.env.MONGODB_URI = uri;
  }

  // SQLite in-memory doesn't need much setup here,
  // but it's handled by TypeORM configuration in DatabaseModule via process.env.DB_TYPE
});

afterAll(async () => {
  if (E2EState.mongod) {
    await E2EState.mongod.stop();
  }
});
