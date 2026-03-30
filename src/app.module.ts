import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './core/users/users.module';
import { AuthModule } from './core/auth/auth.module';
import { FilesModule } from './core/files/files.module';
import { AdminSeeder } from './common/seeder/admin.seeder';
import { DatabaseModule } from './lib/database/module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule.register(),
    UsersModule,
    AuthModule,
    FilesModule,
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