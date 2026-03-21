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

@Module({
  imports: [
    // Support for TypeORM (SQL)
    TypeOrmModule.forFeature([User]),
    // Support for Mongoose (NoSQL)
    MongooseModule.forFeature([{ name: MongoUser.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: 'HASHER_PROVIDER',
      useClass: BcryptHasherProvider,
    },
    // Dynamic repository injection based on the chosen database
    {
      provide: 'USER_REPOSITORY',
      inject: [ConfigService, TypeOrmUserRepository, MongoUserRepository],
      useFactory: (
        configService: ConfigService,
        typeOrmRepo: TypeOrmUserRepository,
        mongoRepo: MongoUserRepository,
      ) => {
        const dbType = configService.get<string>('DB_TYPE', 'sqlite');
        return dbType === 'mongodb' ? mongoRepo : typeOrmRepo;
      },
    },
    // Also declare classes so they are injectable in the factory
    TypeOrmUserRepository,
    MongoUserRepository,
  ],
  exports: [UsersService],
})
export class UsersModule {}