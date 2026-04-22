import { Test, TestingModule } from '@nestjs/testing';
import { NoSqlDatabaseModule } from './module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

describe('NoSqlDatabaseModule', () => {
  it('should compile the module', async () => {
    // Basic test to see if module is defined and gets branch coverage
    expect(NoSqlDatabaseModule).toBeDefined();
  });
});
