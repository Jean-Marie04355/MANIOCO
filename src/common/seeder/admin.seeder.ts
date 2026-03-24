import { Injectable, Logger } from '@nestjs/common';
import { UserRole } from '../enum/role.enum';
import { UsersService } from 'src/core/users/users.service';

@Injectable()
export class AdminSeeder {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(private readonly usersService: UsersService) {}

  async seed() {
    const adminEmail = 'admin@afrigari.com';
    
    try {
      // Check if an admin already exists by email
      const adminExists = await this.usersService.findByEmail(adminEmail);

      if (!adminExists) {
        await this.usersService.create({
          name: 'Admin Afrigari',
          email: adminEmail,
          password: 'MotDePasseSecurise200',
          role: UserRole.ADMIN,
        });

        this.logger.log('Initial admin created successfully!');
      } else {
        this.logger.log('Admin already exists, seeding skipped.');
      }
    } catch (error) {
      this.logger.error('Error during seeding: ' + error.message);
    }
  }
}