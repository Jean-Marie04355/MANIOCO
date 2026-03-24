import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
dotenv.config(); // Load .env before the module is built

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { User as MongoUser, UserSchema } from './schemas/user.schema';
import { UniversalUserRepository } from './user.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getModelToken } from '@nestjs/mongoose';

// Evaluated at module build time, AFTER dotenv.config()
const isMongo = process.env.DB_TYPE?.toLowerCase() === 'mongodb';

@Module({
  imports: [
    // Only load the relevant DB module — never both at the same time
    ...(isMongo
      ? [MongooseModule.forFeature([{ name: MongoUser.name, schema: UserSchema }])]
      : [TypeOrmModule.forFeature([User])]
    ),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: 'USER_REPOSITORY',
      useFactory: (engine: any) => {
        console.log(`--- [UsersModule] DB_TYPE=${process.env.DB_TYPE}, isMongo=${isMongo}`);
        return new UniversalUserRepository(engine);
      },
      // Inject only what we need for the active DB mode
      inject: [
        isMongo
          ? getModelToken(MongoUser.name)
          : getRepositoryToken(User),
      ],
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}