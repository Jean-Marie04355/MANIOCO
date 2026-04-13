import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OrderStatus } from '../../common/enum/order-status.enum';
import { User } from '../users/user.entity';
import { Store } from '../store/store.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column()
  storeId: string;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column('decimal', { precision: 12, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'varchar',
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  // Stockage des items en format JSON pour la flexibilité (compatible SQLite/Postgres)
  @Column('simple-json', { nullable: true })
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
