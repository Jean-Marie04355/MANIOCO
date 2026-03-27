import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'store' })
export class Store {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  ownerId: number;
    UserRole: string;

     @Column({ nullable: true })
  description: string;

  @Column()
  localisation: string;

  @Column({nullable: true})
  phone: string;
}
  
