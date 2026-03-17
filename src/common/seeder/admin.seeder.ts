import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../enum/role.enum';
import { User } from 'src/core/users/user.entity';

@Injectable()
export class AdminSeeder {
  constructor(private dataSource: DataSource) {}

  async seed() {
    const userRepository = this.dataSource.getRepository(User);

    // Vérifie si un admin existe déjà
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
      console.log(' Admin initial créé avec succès !');
    } else {
      console.log('L’admin existe déjà, seed ignoré.');
    }
  }
}