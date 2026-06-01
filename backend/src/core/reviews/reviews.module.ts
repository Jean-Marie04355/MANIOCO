import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review } from './review.entity';
import { Review as MongoReview, ReviewSchema } from './schemas/review.schema';
import { NoSqlRepository } from '../../libs/no-sql-database/repository';
import { SqlRepository } from '../../libs/sql-database/repository';

const dbType = process.env.DB_TYPE?.toLowerCase();

@Module({
  imports: [
    dbType === 'mongodb'
      ? MongooseModule.forFeature([{ name: MongoReview.name, schema: ReviewSchema }])
      : TypeOrmModule.forFeature([Review]),
  ],
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    {
      provide: 'REVIEW_REPOSITORY',
      inject: [
        ConfigService,
        dbType === 'mongodb' ? getModelToken(MongoReview.name) : getRepositoryToken(Review),
      ],
      useFactory: (config: ConfigService, engine: unknown) => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine as never)
          : new SqlRepository(engine as never);
      },
    },
  ],
  exports: [ReviewsService],
})
export class ReviewsModule {}
