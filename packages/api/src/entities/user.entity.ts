import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'blob' : 'bytea' })
  wrappedUMK: Buffer;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'blob' : 'bytea' })
  salt: Buffer;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'json' : 'jsonb' })
  argon2Params: {
    m: number;
    t: number;
    p: number;
  };

  @CreateDateColumn({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamptz',
  })
  updatedAt: Date;
}
