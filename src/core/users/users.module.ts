import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';

import { User } from './user.entity';
import { User as MongoUser, UserDocument, UserSchema } from './schemas/user.schema';
import { NoSqlRepository } from 'src/lib/no-sql-database/repository';
import { SqlRepository } from 'src/lib/sql-database/repository';
import { IBaseRepository } from 'src/common/interfaces/base-repository.interface';
import { RolesGuard } from 'src/common/guards/roles.guard';

import * as dotenv from 'dotenv';
dotenv.config();
const dbType = process.env.DB_TYPE?.toLowerCase();

@Module({
  imports: [
    ...(dbType !== 'mongodb' ? [TypeOrmModule.forFeature([User])] : []),
    ...(dbType === 'mongodb' ? [MongooseModule.forFeature([{ name: MongoUser.name, schema: UserSchema }])] : []),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    RolesGuard,

    {
      provide: 'USER_REPOSITORY',
      inject: [
        ConfigService,
        ...(dbType === 'mongodb' ? [getModelToken(MongoUser.name)] : [getRepositoryToken(User)]),
      ],
      useFactory: (config: ConfigService, engine: any) => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine)
          : new SqlRepository(engine);
      },
    },
  ],
  exports: [UsersService, 'USER_REPOSITORY'],
})
export class UsersModule {}