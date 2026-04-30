import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { Ticket } from './ticket.entity';
import { TicketMessage } from './ticket-message.entity';
import { Ticket as MongoTicket, TicketSchema } from './schemas/ticket.schema';
import {
  TicketMessage as MongoTicketMessage,
  TicketMessageSchema,
} from './schemas/ticket-message.schema';
import { NoSqlRepository } from '../../libs/no-sql-database/repository';
import { SqlRepository } from '../../libs/sql-database/repository';

const dbType = process.env.DB_TYPE?.toLowerCase();

@Module({
  imports: [
    dbType === 'mongodb'
      ? MongooseModule.forFeature([
          { name: MongoTicket.name, schema: TicketSchema },
          { name: MongoTicketMessage.name, schema: TicketMessageSchema },
        ])
      : TypeOrmModule.forFeature([Ticket, TicketMessage]),
  ],
  controllers: [SupportController],
  providers: [
    SupportService,
    {
      provide: 'TICKET_REPOSITORY',
      inject: [
        ConfigService,
        dbType === 'mongodb'
          ? getModelToken(MongoTicket.name)
          : getRepositoryToken(Ticket),
      ],
      useFactory: (config: ConfigService, engine: unknown) => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine as never)
          : new SqlRepository(engine as never);
      },
    },
    {
      provide: 'TICKET_MESSAGE_REPOSITORY',
      inject: [
        ConfigService,
        dbType === 'mongodb'
          ? getModelToken(MongoTicketMessage.name)
          : getRepositoryToken(TicketMessage),
      ],
      useFactory: (config: ConfigService, engine: unknown) => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine as never)
          : new SqlRepository(engine as never);
      },
    },
  ],
  exports: [SupportService],
})
export class SupportModule {}
