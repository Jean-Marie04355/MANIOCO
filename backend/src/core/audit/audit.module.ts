import { Module, Global, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

class NoOpAuditService {
  async log() {
    return null;
  }

  async findAll() {
    return [];
  }

  async getStats() {
    return [];
  }
}

@Global()
@Module({})
export class AuditModule {
  static register(): DynamicModule {
    const useTypeORM = process.env.DB_TYPE?.toLowerCase() !== 'mongodb';

    return {
      module: AuditModule,
      imports: useTypeORM ? [TypeOrmModule.forFeature([AuditLog])] : [],
      providers: useTypeORM
        ? [AuditService]
        : [
            {
              provide: AuditService,
              useClass: NoOpAuditService,
            },
          ],
      controllers: useTypeORM ? [AuditController] : [],
      exports: [AuditService],
    };
  }
}
