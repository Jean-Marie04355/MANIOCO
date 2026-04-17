import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Global, Module } from '@nestjs/common';
import { NoSqlRepository } from './repository';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>(
          'MONGO_URI',
          'mongodb://localhost:27017/afrigari',
        ),
      }),
    }),
  ],
  providers: [NoSqlRepository],
  exports: [MongooseModule, NoSqlRepository],
})
export class NoSqlDatabaseModule {}
