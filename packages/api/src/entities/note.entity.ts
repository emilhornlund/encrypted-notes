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

  @Column({ type: 'bytea' })
  titleCt: Buffer;

  @Column({ type: 'bytea' })
  bodyCt: Buffer;

  @Column({ type: 'bytea' })
  ivTitle: Buffer;

  @Column({ type: 'bytea' })
  ivBody: Buffer;

  @OneToMany(() => NoteTerm, (term) => term.note, { cascade: true })
  terms: NoteTerm[];

  @OneToMany(() => NoteTag, (noteTag) => noteTag.note, { cascade: true })
  noteTags: NoteTag[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
