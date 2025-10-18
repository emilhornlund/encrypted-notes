import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { NoteTag } from './note-tag.entity';
import { NoteTerm } from './note-term.entity';
import { User } from './user.entity';

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'blob' : 'bytea' })
  titleCt: Buffer;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'blob' : 'bytea' })
  bodyCt: Buffer;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'blob' : 'bytea' })
  ivTitle: Buffer;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'blob' : 'bytea' })
  ivBody: Buffer;

  @OneToMany(() => NoteTerm, (term) => term.note, { cascade: true })
  terms: NoteTerm[];

  @OneToMany(() => NoteTag, (noteTag) => noteTag.note, { cascade: true })
  noteTags: NoteTag[];

  @CreateDateColumn({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamptz',
  })
  updatedAt: Date;
}
