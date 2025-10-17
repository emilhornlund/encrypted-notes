import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Note } from './note.entity';

@Entity('note_terms')
export class NoteTerm {
  @PrimaryColumn('uuid')
  noteId: string;

  @PrimaryColumn({ type: 'bytea' })
  termHash: Buffer;

  @ManyToOne(() => Note, (note) => note.terms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'noteId' })
  note: Note;
}
