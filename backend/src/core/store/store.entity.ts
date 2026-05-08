import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductCategory } from '../product-categories/product-category.entity';
import { User } from '../users/user.entity';

@Entity({ name: 'store' })
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true, nullable: true })
  ownerId: string;

  @Column({ nullable: true })
  profilePhoto: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'double precision', nullable: true })
  latitude: number;

  @Column({ type: 'double precision', nullable: true })
  longitude: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  phone: string;

  @OneToMany(() => ProductCategory, (category) => category.store)
  categories: ProductCategory[];

  @Column({ nullable: true })
  payoutAccountId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner: User;
}
