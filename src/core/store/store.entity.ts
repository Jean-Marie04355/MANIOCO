import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Category } from '../categories/category.entity';

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

  @Column()
  localisation: string;

  @Column({ nullable: true })
  phone: string;

  @OneToMany(() => Category, (category) => category.store)
  categories: Category[];
}

  
