import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ProductCategory } from '../product-categories/product-category.entity';

@Entity({ name: 'store' })
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
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
}


