import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
  CreateDateColumn,
} from 'typeorm';
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

  // Using 'varchar' instead of 'enum' allows compatibility with SQLite
  @Column({ type: 'varchar', default: UserRole.CLIENT })
  role: UserRole;

  @Column({ type: 'simple-array', nullable: true })
  permissions: string[];

  @Column({ nullable: true })
  profilePhoto: string;

  @Column({ nullable: true })
  otpCode: string;

  @Column({ nullable: true })
  otpExpiresAt: Date;

  @Column({ default: true })
  isVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  suspensionUntil: Date;

  @Column({ nullable: true })
  suspensionReason: string;

  // --- KYC / VENDOR VERIFICATION ---
  @Column({ nullable: true })
  dob: string; // Date of birth

  @Column({ nullable: true })
  nationality: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  idCardFront: string; // URL

  @Column({ nullable: true })
  idCardBack: string; // URL

  @Column({ nullable: true })
  sellerSelfie: string; // URL

  @Column({ type: 'varchar', default: 'NOT_SUBMITTED' })
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'REJECTED' | 'APPROVED';

  @Column({ type: 'text', nullable: true })
  kycRejectionReasons: string; // JSON: { dob: '...', nationality: '...', ... }

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}
