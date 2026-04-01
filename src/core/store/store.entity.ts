import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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
}
  
