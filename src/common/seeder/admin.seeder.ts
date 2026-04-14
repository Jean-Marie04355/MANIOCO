import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../enum/role.enum';
import { UsersService } from '../../core/users/users.service';

@Injectable()
export class AdminSeeder {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async seed() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      this.logger.warn(
        'ADMIN_EMAIL or ADMIN_PASSWORD not defined in environment, skipping seeding.',
      );
      return;
    }

    try {
      // Check if an admin already exists by email
      const adminExists = await this.usersService.findByEmail(adminEmail);

      if (!adminExists) {
        await this.usersService.create({
          name: 'Admin Afrigari',
          email: adminEmail,
          password: adminPassword,
          role: UserRole.ADMIN,
        });

        this.logger.log('Initial admin created successfully!');
      } else {
        this.logger.log(`Admin ${adminEmail} already exists, seeding skipped.`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Error during seeding: ' + message);
    }
  }
}
