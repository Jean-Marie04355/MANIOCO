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

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}