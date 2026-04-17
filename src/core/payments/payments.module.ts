import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

import { Transaction } from './transaction.entity';
import {
  Transaction as MongoTransaction,
  TransactionSchema,
} from './schemas/transaction.schema';

import * as dotenv from 'dotenv';
import { NoSqlRepository } from '../../libs/no-sql-database/repository';
import { SqlRepository } from '../../libs/sql-database/repository';
import { OrdersModule } from '../orders/orders.module';
import { QueuesModule } from '../../libs/queues/queues.module';
import { UsersModule } from '../users/users.module';
dotenv.config();
const dbType = process.env.DB_TYPE?.toLowerCase();

@Module({
  imports: [
    dbType === 'mongodb'
      ? MongooseModule.forFeature([
          { name: MongoTransaction.name, schema: TransactionSchema },
        ])
      : TypeOrmModule.forFeature([Transaction]),
    forwardRef(() => OrdersModule),
    QueuesModule,
    UsersModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: 'TRANSACTION_REPOSITORY',
      inject: [
        ConfigService,
        dbType === 'mongodb'
          ? getModelToken(MongoTransaction.name)
          : getRepositoryToken(Transaction),
      ],
      useFactory: (config: ConfigService, engine: unknown) => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine as never)
          : new SqlRepository(engine as never);
      },
    },
  ],
  exports: [PaymentsService, 'TRANSACTION_REPOSITORY'],
})
export class PaymentsModule {}
