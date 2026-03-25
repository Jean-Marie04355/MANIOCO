import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';

import { User } from './user.entity';
import { User as MongoUser, UserSchema } from './schemas/user.schema';

import { TypeOrmUserRepository } from './repositories/typeorm-user.repository';
import { MongoUserRepository } from './repositories/mongo-user.repository';

const dbType = process.env.DB_TYPE;

@Module({
  imports: [
    ...(dbType !== 'mongodb' ? [TypeOrmModule.forFeature([User])] : []),
    ...(dbType === 'mongodb' ? [MongooseModule.forFeature([{ name: MongoUser.name, schema: UserSchema }])] : []),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,

    // Fournir uniquement les repositories nécessaires selon DB_TYPE
    ...(dbType !== 'mongodb' ? [TypeOrmUserRepository] : []),
    ...(dbType === 'mongodb' ? [MongoUserRepository] : []),

    // Factory pour USER_REPOSITORY
    {
      provide: 'USER_REPOSITORY',
      inject: [
        ...(dbType !== 'mongodb' ? [TypeOrmUserRepository] : []),
        ...(dbType === 'mongodb' ? [MongoUserRepository] : []),
        ConfigService,
      ],
      useFactory: (...reposAndConfig: any[]) => {
        const config = reposAndConfig[reposAndConfig.length - 1]; // dernier = ConfigService
        const repo = reposAndConfig[0]; // le repository correct injecté
        return repo;
      },
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}