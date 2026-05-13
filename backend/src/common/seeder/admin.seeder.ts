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
          role: UserRole.SUPER_ADMIN,
        });
        this.logger.log(`Initial admin created successfully: ${adminEmail}`);
      } else {
        // Force update existing admin to match .env (role and password)
        await this.usersService.update(adminExists.id, {
          role: UserRole.SUPER_ADMIN,
          password: adminPassword, // usersService.update handles hashing
        });
        this.logger.log(`Admin credentials updated successfully: ${adminEmail}`);
      }
    } catch {
      this.logger.error('Error during seeding');
    }
  }
}
