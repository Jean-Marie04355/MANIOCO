import { MongoMemoryServer } from 'mongodb-memory-server';
import { DataSource } from 'typeorm';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  // Setup MongoDB Memory Server if needed
  if (process.env.DB_TYPE === 'mongodb') {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGODB_URI = uri;
  }

  // SQLite in-memory doesn't need much setup here, 
  // but it's handled by TypeORM configuration in DatabaseModule via process.env.DB_TYPE
});

afterAll(async () => {
  if (mongod) {
    await mongod.stop();
  }
});
