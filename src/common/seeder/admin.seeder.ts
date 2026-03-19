import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../enum/role.enum';
import { User } from 'src/core/users/user.entity';

@Injectable()
export class AdminSeeder {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(private dataSource: DataSource) {}

  async seed() {
    const userRepository = this.dataSource.getRepository(User);

    // Check if an admin already exists
    const adminExists = await userRepository.findOne({ where: { role: UserRole.ADMIN } });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('MotDePasseSecurise200', 10);

      const admin = userRepository.create({
        name: 'Admin Afrigari',
        email: 'admin@afrigari.com',
        password: hashedPassword,
        role: UserRole.ADMIN,
      });

      await userRepository.save(admin);
      this.logger.log('Initial admin created successfully!');
    } else {
      this.logger.log('Admin already exists, seeding skipped.');
    }
  }
}