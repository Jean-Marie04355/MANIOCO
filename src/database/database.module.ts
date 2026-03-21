import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';

@Global()
@Module({
  imports: [
    ConfigModule,
    // Dynamic database configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DB_TYPE', 'sqlite');

        if (dbType === 'sqlite') {
          return {
            type: 'sqlite',
            database: configService.get<string>('SQLITE_DB', 'data/database.sqlite'),
            autoLoadEntities: true,
            synchronize: true,
          };
        }

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
        
        return { type: 'sqlite', database: ':memory:', autoLoadEntities: true }; // Fallback
      },
    }),
    // Optional: MongoDB connection if DB_TYPE is mongo
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DB_TYPE');
        if (dbType === 'mongodb') {
          return {
            uri: configService.get<string>('MONGO_URI', 'mongodb://localhost:27017/afrigari'),
          };
        }
        return { uri: 'mongodb://localhost:27017/unused' }; // Dummy connection
      },
    }),
  ],
  exports: [TypeOrmModule, MongooseModule],
})
export class DatabaseModule {}
