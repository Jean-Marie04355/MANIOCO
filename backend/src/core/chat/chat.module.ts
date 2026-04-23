import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Conversation, Message } from './entities/chat.entity';
import { SqlRepository } from '../../libs/sql-database/repository';
import { StoreModule } from '../store/store.module';
import { RealtimeModule } from '../../libs/realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    StoreModule,
    RealtimeModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    {
      provide: 'CONVERSATION_REPOSITORY',
      inject: [ConfigService, getRepositoryToken(Conversation)],
      useFactory: (_config: ConfigService, engine: unknown) => {
        return new SqlRepository(engine as never);
      },
    },
    {
      provide: 'MESSAGE_REPOSITORY',
      inject: [ConfigService, getRepositoryToken(Message)],
      useFactory: (_config: ConfigService, engine: unknown) => {
        return new SqlRepository(engine as never);
      },
    },
  ],
  exports: [ChatService],
})
export class ChatModule {}
