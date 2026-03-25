
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

...(process.env.DB_TYPE === 'mongodb'
      ? [
          MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              uri: config.get<string>(
                'MONGO_URI',
                'mongodb://localhost:27017/afrigari'
              ),
            }),
          }),
        ]
      : []),
  ],
  exports: [
    ...(process.env.DB_TYPE === 'mongodb' ? [MongooseModule] : []),
  ],
})
export class NoSqlDatabaseModule {}