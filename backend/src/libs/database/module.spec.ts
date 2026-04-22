import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from './module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SqlDatabaseModule } from '../sql-database/module';
import { NoSqlDatabaseModule } from '../no-sql-database/module';

describe('DatabaseModule', () => {
  it('should register for mongo when DB_TYPE is mongodb', () => {
    process.env.DB_TYPE = 'mongodb';
    
    const module = DatabaseModule.register();
    expect(module.module).toBe(DatabaseModule);
    expect(module.imports).toContain(NoSqlDatabaseModule);
    
    // Test factory
    const provider = module.providers![0] as any;
    expect(provider.provide).toBe('DATABASE_REPOSITORY');
    const mockRepo = {};
    expect(provider.useFactory(null, mockRepo)).toBe(mockRepo);
  });

  it('should register for postgres when DB_TYPE is postgres', () => {
    process.env.DB_TYPE = 'postgres';
    
    const module = DatabaseModule.register();
    expect(module.module).toBe(DatabaseModule);
    expect(module.imports).toContain(SqlDatabaseModule);
    
    // Test factory
    const provider = module.providers![0] as any;
    expect(provider.provide).toBe('DATABASE_REPOSITORY');
    const mockRepo = {};
    expect(provider.useFactory(null, mockRepo)).toBe(mockRepo);
  });
});
