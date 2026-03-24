import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const isMongo = process.env.DB_TYPE?.toLowerCase() === 'mongodb';

const databaseImports: any[] = [];

if (isMongo) {
  databaseImports.push(
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI', 'mongodb://localhost:27017/afrigari'),
      }),
    })
  );
} else {
  databaseImports.push(
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DB_TYPE', 'sqlite');
        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: configService.get<string>('DB_HOST'),
            port: parseInt(configService.get<string>('DB_PORT') || '5432'),
            username: configService.get<string>('DB_USER'),
            password: configService.get<string>('DB_PASS'),
            database: configService.get<string>('DB_NAME'),
            autoLoadEntities: true,
            synchronize: true,
          };
        }
        return { 
          type: 'sqlite', 
          database: configService.get<string>('SQLITE_DB', 'data/database.sqlite'), 
          autoLoadEntities: true, 
          synchronize: true 
        };
      },
    })
  );
}

@Global()
@Module({
  imports: [ConfigModule, ...databaseImports],
  exports: [...databaseImports],
})
export class DatabaseModule {}
