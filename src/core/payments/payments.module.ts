import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

import { Transaction } from './transaction.entity';
import {
  Transaction as MongoTransaction,
  TransactionSchema,
} from './schemas/transaction.schema';

import * as dotenv from 'dotenv';
import { NoSqlRepository } from '../../lib/no-sql-database/repository';
import { SqlRepository } from '../../lib/sql-database/repository';
dotenv.config();
const dbType = process.env.DB_TYPE?.toLowerCase();

@Module({
  imports: [
    ...(dbType !== 'mongodb' ? [TypeOrmModule.forFeature([Transaction])] : []),
    ...(dbType === 'mongodb'
      ? [
          MongooseModule.forFeature([
            { name: MongoTransaction.name, schema: TransactionSchema },
          ]),
        ]
      : []),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: 'TRANSACTION_REPOSITORY',
      inject: [
        ConfigService,
        ...(dbType === 'mongodb'
          ? [getModelToken(MongoTransaction.name)]
          : [getRepositoryToken(Transaction)]),
      ],
      useFactory: (config: ConfigService, engine: any) => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine)
          : new SqlRepository(engine);
      },
    },
  ],
  exports: [PaymentsService, 'TRANSACTION_REPOSITORY'],
})
export class PaymentsModule {}
