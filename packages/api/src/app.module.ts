import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { User } from './entities/user.entity';
import { Note } from './entities/note.entity';
import { NoteTerm } from './entities/note-term.entity';
import { Tag } from './entities/tag.entity';
import { NoteTag } from './entities/note-tag.entity';
import { TagTerm } from './entities/tag-term.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'password',
      database: process.env.DATABASE_NAME || 'encrypted_notes',
      entities: [User, Note, NoteTerm, Tag, NoteTag, TagTerm],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}