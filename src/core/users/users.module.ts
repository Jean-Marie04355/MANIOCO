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

import { NoSqlRepository } from '../../lib/no-sql-database/repository';
import { SqlRepository } from '../../lib/sql-database/repository';
import { RolesGuard } from '../../common/guards/roles.guard';

// dbType calculé via env (NestJS s'occupe de charger le .env via ConfigModule globalement)
const dbType = process.env.DB_TYPE?.toLowerCase();

@Module({
  imports: [
    ...(dbType !== 'mongodb' ? [TypeOrmModule.forFeature([User])] : []),
    ...(dbType === 'mongodb'
      ? [
          MongooseModule.forFeature([
            { name: MongoUser.name, schema: UserSchema },
          ]),
        ]
      : []),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    RolesGuard,

    {
      provide: 'USER_REPOSITORY',
      inject: [
        ConfigService,
        ...(dbType === 'mongodb'
          ? [getModelToken(MongoUser.name)]
          : [getRepositoryToken(User)]),
      ],
      useFactory: (config: ConfigService, engine: unknown) => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine)
          : new SqlRepository(engine);
      },
    },
  ],
  exports: [UsersService, 'USER_REPOSITORY'],
})
export class UsersModule {}
