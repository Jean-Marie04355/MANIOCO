import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule, InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';

import { User } from './user.entity';
import { User as MongoUser, UserDocument, UserSchema } from './schemas/user.schema';
import { BaseRepository } from 'src/database/repositories/base.repository';


const dbType = process.env.DB_TYPE;

@Module({
  imports: [
    ...(dbType !== 'mongodb' ? [TypeOrmModule.forFeature([User])] : []),
    ...(dbType === 'mongodb' ? [MongooseModule.forFeature([{ name: MongoUser.name, schema: UserSchema }])] : []),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,

    {
      provide: 'USER_REPOSITORY',
      inject: [
        ConfigService,
        ...(dbType === 'mongodb' ? [InjectModel(MongoUser.name)] : []),
      ],
      useFactory: (config: ConfigService, mongoModel?: Model<UserDocument>) => {
        if (config.get<string>('DB_TYPE') === 'mongodb') {
          return new BaseRepository<UserDocument>({ mongoModel });
        } else {
          
          return null; 
        }
      },
    },
  ],
  exports: [UsersService, 'USER_REPOSITORY'],
})
export class UsersModule {}