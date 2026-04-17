import { Test, TestingModule } from '@nestjs/testing';
import { SqlDatabaseModule } from './module';

describe('SqlDatabaseModule', () => {
  it('should compile the module', async () => {
    expect(SqlDatabaseModule).toBeDefined();
  });
});
