import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Tag } from './tag.entity';

@Entity('tag_terms')
@Index(['termHash'])
export class TagTerm {
  @PrimaryColumn('uuid')
  tagId: string;

  @PrimaryColumn({ type: process.env.NODE_ENV === 'test' ? 'blob' : 'bytea' })
  termHash: Buffer;

  @ManyToOne(() => Tag, (tag) => tag.terms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tagId' })
  tag: Tag;
}
