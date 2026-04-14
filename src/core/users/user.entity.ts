import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn } from 'typeorm';
import { UserRole } from '../../common/enum/role.enum';

@Entity('users')
export class User {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  // L'utilisation de 'varchar' au lieu de 'enum' permet la compatibilité avec SQLite
  @Column({ type: 'varchar', default: UserRole.CLIENT })
  role: UserRole;

  @Column({ nullable: true })
  otpCode: string;

  @Column({ type: 'datetime', nullable: true })
  otpExpiresAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}