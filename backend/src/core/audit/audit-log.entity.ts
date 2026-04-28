import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CREATE_ADMIN = 'CREATE_ADMIN',
  SUSPEND_ADMIN = 'SUSPEND_ADMIN',
  RESTORE_ADMIN = 'RESTORE_ADMIN',
  RESET_PASSWORD = 'RESET_PASSWORD',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_PRODUCT = 'DELETE_PRODUCT',
  DELETE_ADMIN = 'DELETE_ADMIN',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  adminName: string;

  @Column()
  adminEmail: string;

  @Column({ type: 'varchar' })
  action: AuditAction;

  @Column({ type: 'text' })
  details: string;

  @Column({ nullable: true })
  targetId: string;

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}
