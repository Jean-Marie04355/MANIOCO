import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { User as MongoUser, UserSchema } from './schemas/user.schema';
import { BcryptHasherProvider } from '../providers/bcrypt-hasher.provider';
import { TypeOrmUserRepository } from '../providers/typeorm-user.repository';
import { MongoUserRepository } from '../providers/mongo-user.repository';

import * as dotenv from 'dotenv';
dotenv.config();
const isMongo = process.env.DB_TYPE === 'mongodb';

@Module({
  imports: [
    ...(isMongo 
      ? [MongooseModule.forFeature([{ name: MongoUser.name, schema: UserSchema }])] 
      : [TypeOrmModule.forFeature([User])]
    )
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: 'HASHER_PROVIDER',
      useClass: BcryptHasherProvider,
    },
    // We only inject the Repository class that matches the database
    ...(isMongo ? [MongoUserRepository] : [TypeOrmUserRepository]),
    {
      provide: 'USER_REPOSITORY',
      inject: [isMongo ? MongoUserRepository : TypeOrmUserRepository],
      useFactory: (selectedRepo) => {
        return selectedRepo;
      },
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}