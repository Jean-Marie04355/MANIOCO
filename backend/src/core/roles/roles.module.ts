import 'dotenv/config';
import { Global, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { Role } from './role.entity';
import { Role as MongoRole, RoleSchema } from './schemas/role.schema';
import { NoSqlRepository } from '../../libs/no-sql-database/repository';
import { SqlRepository } from '../../libs/sql-database/repository';
import { RolesGuard } from '../../common/guards/roles.guard';

const dbType = process.env.DB_TYPE?.toLowerCase();

@Global()
@Module({
  imports: [
    ConfigModule,
    dbType === 'mongodb'
      ? MongooseModule.forFeature([{ name: MongoRole.name, schema: RoleSchema }])
      : TypeOrmModule.forFeature([Role]),
  ],
  controllers: [RolesController],
  providers: [
    RolesService,
    RolesGuard,
    {
      provide: 'ROLE_REPOSITORY',
      inject: [
        ConfigService,
        dbType === 'mongodb' ? getModelToken(MongoRole.name) : getRepositoryToken(Role),
      ],
      useFactory: (config: ConfigService, engine: any) => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine)
          : new SqlRepository(engine);
      },
    },
  ],
  exports: [RolesService, RolesGuard, 'ROLE_REPOSITORY'],
})
export class RolesModule implements OnModuleInit {
  constructor(private readonly rolesService: RolesService) {}

  async onModuleInit() {
    await this.rolesService.initializeSystemRoles();
  }
}
