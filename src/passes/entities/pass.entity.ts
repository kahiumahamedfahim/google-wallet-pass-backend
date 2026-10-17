import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('passes')
export class Pass {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 100 })
  passId!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ length: 150 })
  label!: string;

  @Column({ type: 'integer' })
  value!: number;

  @Column({ default: 'google' })
  provider!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}