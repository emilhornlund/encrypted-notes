import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { Note } from '../../entities/note.entity';
import { NoteTerm } from '../../entities/note-term.entity';
import { NoteTag } from '../../entities/note-tag.entity';
import { Tag } from '../../entities/tag.entity';
import { TagTerm } from '../../entities/tag-term.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Note, NoteTerm, NoteTag, Tag, TagTerm])],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
