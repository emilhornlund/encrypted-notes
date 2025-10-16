import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Tag } from './tag.entity';

@Entity('tag_terms')
@Index(['termHash'])
export class TagTerm {
  @PrimaryColumn('uuid')
  tagId: string;

  @PrimaryColumn({ type: 'bytea' })
  termHash: Buffer;

  @ManyToOne(() => Tag, (tag) => tag.terms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tagId' })
  tag: Tag;
}
