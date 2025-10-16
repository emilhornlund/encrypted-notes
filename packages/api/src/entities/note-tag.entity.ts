import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Note } from './note.entity';
import { Tag } from './tag.entity';

@Entity('note_tags')
export class NoteTag {
  @PrimaryColumn('uuid')
  noteId: string;

  @PrimaryColumn('uuid')
  tagId: string;

  @ManyToOne(() => Note, note => note.noteTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'noteId' })
  note: Note;

  @ManyToOne(() => Tag, tag => tag.noteTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tagId' })
  tag: Tag;
}