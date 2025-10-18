import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/modules/auth/auth.module';
import { HealthModule } from '../src/modules/health/health.module';
import { NotesModule } from '../src/modules/notes/notes.module';
import { Note } from '../src/entities/note.entity';
import { NoteTag } from '../src/entities/note-tag.entity';
import { NoteTerm } from '../src/entities/note-term.entity';
import { Tag } from '../src/entities/tag.entity';
import { TagTerm } from '../src/entities/tag-term.entity';
import { User } from '../src/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [User, Note, Tag, NoteTag, NoteTerm, TagTerm],
      synchronize: true,
      dropSchema: true,
    }),
    AuthModule,
    HealthModule,
    NotesModule,
  ],
})
export class TestAppModule {}