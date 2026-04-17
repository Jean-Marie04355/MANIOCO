import { MongoMemoryServer } from 'mongodb-memory-server';
import { DataSource } from 'typeorm';

class E2EState {
  static mongod: MongoMemoryServer;
}

beforeAll(async () => {
  // Setup MongoDB Memory Server if needed
  if (process.env.DB_TYPE === 'mongodb') {
    E2EState.mongod = await MongoMemoryServer.create();
    const uri = E2EState.mongod.getUri();
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
