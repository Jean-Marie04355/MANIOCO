import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserRole } from '../../common/enum/role.enum';

@Entity('users')
export class User {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  // L'utilisation de 'varchar' au lieu de 'enum' permet la compatibilité avec SQLite
  @Column({ type: 'varchar', default: UserRole.CLIENT })
  role: UserRole;

}