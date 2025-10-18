import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Note } from './note.entity';

@Entity('note_terms')
export class NoteTerm {
  @PrimaryColumn('uuid')
  noteId: string;

  @PrimaryColumn({ type: process.env.NODE_ENV === 'test' ? 'blob' : 'bytea' })
  termHash: Buffer;

  @ManyToOne(() => Note, (note) => note.terms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'noteId' })
  note: Note;
}
