import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './core/users/users.module';
import { AdminSeeder } from './common/seeder/admin.seeder';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService, AdminSeeder],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly adminSeeder: AdminSeeder) {}

  async onApplicationBootstrap() {
    await this.adminSeeder.seed();
  }
}