import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Conversation, Message } from './entities/chat.entity';
import {
  Conversation as MongoConversation,
  ConversationSchema,
} from './schemas/conversation.schema';
import {
  Message as MongoMessage,
  MessageSchema,
} from './schemas/message.schema';
import { NoSqlRepository } from '../../libs/no-sql-database/repository';
import { SqlRepository } from '../../libs/sql-database/repository';
import { StoreModule } from '../store/store.module';
import { RealtimeModule } from '../../libs/realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

const dbType = process.env.DB_TYPE?.toLowerCase();

@Module({
  imports: [
    dbType === 'mongodb'
      ? MongooseModule.forFeature([
          { name: MongoConversation.name, schema: ConversationSchema },
          { name: MongoMessage.name, schema: MessageSchema },
        ])
      : TypeOrmModule.forFeature([Conversation, Message]),
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
      inject: [
        ConfigService,
        dbType === 'mongodb'
          ? getModelToken(MongoConversation.name)
          : getRepositoryToken(Conversation),
      ],
      useFactory: (config: ConfigService, engine: unknown) => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine as never)
          : new SqlRepository(engine as never);
      },
    },
    {
      provide: 'MESSAGE_REPOSITORY',
      inject: [
        ConfigService,
        dbType === 'mongodb'
          ? getModelToken(MongoMessage.name)
          : getRepositoryToken(Message),
      ],
      useFactory: (config: ConfigService, engine: unknown) => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine as never)
          : new SqlRepository(engine as never);
      },
    },
  ],
  exports: [ChatService],
})
export class ChatModule {}
