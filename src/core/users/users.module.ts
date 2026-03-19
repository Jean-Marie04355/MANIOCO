import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { BcryptHasherProvider } from '../providers/bcrypt-hasher.provider';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: 'HASHER_PROVIDER',
      useClass: BcryptHasherProvider,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}