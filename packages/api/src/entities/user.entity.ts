import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'bytea' })
  wrappedUMK: Buffer;

  @Column({ type: 'bytea' })
  salt: Buffer;

  @Column({ type: 'jsonb' })
  argon2Params: {
    m: number;
    t: number;
    p: number;
  };

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}