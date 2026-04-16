import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';

import { User } from './user.entity';
import {
  User as MongoUser,
  UserSchema,
} from './schemas/user.schema';

import { NoSqlRepository } from '../../libs/no-sql-database/repository';
import { SqlRepository } from '../../libs/sql-database/repository';
import { RolesGuard } from '../../common/guards/roles.guard';

// dbType calculated via env (NestJS handles loading the .env via ConfigModule globally)
const dbType = process.env.DB_TYPE?.toLowerCase();

@Module({
  imports: [
    dbType === 'mongodb'
      ? MongooseModule.forFeature([
          { name: MongoUser.name, schema: UserSchema },
        ])
      : TypeOrmModule.forFeature([User]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    RolesGuard,

    {
      provide: 'USER_REPOSITORY',
      inject: [
        ConfigService,
        dbType === 'mongodb'
          ? getModelToken(MongoUser.name)
          : getRepositoryToken(User),
      ],
      useFactory: (config: ConfigService, engine: unknown) => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine as never)
          : new SqlRepository(engine as never);
      },
    },
  ],
  exports: [UsersService, 'USER_REPOSITORY'],
})
export class UsersModule {}
