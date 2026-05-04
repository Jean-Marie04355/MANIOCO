import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';
import { Store } from '../store/store.entity';

export enum ReportStatus {
  NEW = 'NEW',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reason: string;

  @Column('text')
  description: string;

  @Column({
    type: 'varchar',
    default: ReportStatus.NEW,
  })
  status: ReportStatus;

  @Column({ type: 'text', nullable: true })
  internalNote: string;

  @Column()
  reporterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column()
  sellerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column({ nullable: true })
  storeId: string;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column({ nullable: true })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
