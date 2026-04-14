import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ProductCategory } from '../product-categories/product-category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal')
  price: number;

  @Column({ default: 'FCFA' })
  currency: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ nullable: true })
  description: string;

  @Column()
  categoryId: string;

  @ManyToOne(() => ProductCategory, { eager: true, nullable: false })
  @JoinColumn({ name: 'categoryId' })
  category: ProductCategory;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}
