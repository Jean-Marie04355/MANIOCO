import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

import { Order } from './order.entity';
import { Order as MongoOrder, OrderSchema } from './schemas/order.schema';
import { PaymentsModule } from '../payments/payments.module';
import { StoreModule } from '../store/store.module';
import { ProductsModule } from '../products/products.module';

import * as dotenv from 'dotenv';
import { NoSqlRepository } from '../../lib/no-sql-database/repository';
import { SqlRepository } from '../../lib/sql-database/repository';
dotenv.config();
const dbType = process.env.DB_TYPE?.toLowerCase();

@Module({
  imports: [
    ...(dbType !== 'mongodb' ? [TypeOrmModule.forFeature([Order])] : []),
    ...(dbType === 'mongodb'
      ? [
          MongooseModule.forFeature([
            { name: MongoOrder.name, schema: OrderSchema },
          ]),
        ]
      : []),
    PaymentsModule,
    StoreModule,
    ProductsModule,
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    {
      provide: 'ORDER_REPOSITORY',
      inject: [
        ConfigService,
        ...(dbType === 'mongodb'
          ? [getModelToken(MongoOrder.name)]
          : [getRepositoryToken(Order)]),
      ],
      useFactory: (config: ConfigService, engine: unknown) => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine as never)
          : new SqlRepository(engine as never);
      },
    },
  ],
  exports: [OrdersService, 'ORDER_REPOSITORY'],
})
export class OrdersModule {}
