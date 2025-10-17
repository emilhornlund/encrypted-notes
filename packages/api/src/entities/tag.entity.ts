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
import { TagTerm } from './tag-term.entity';
import { User } from './user.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: 'bytea' })
  tagCt: Buffer;

  @Column({ type: 'bytea' })
  ivTag: Buffer;

  @OneToMany(() => NoteTag, (noteTag) => noteTag.tag, { cascade: true })
  noteTags: NoteTag[];

  @OneToMany(() => TagTerm, (term) => term.tag, { cascade: true })
  terms: TagTerm[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
