import {
  BatchNotesResponse,
  CreateNoteRequest,
  NoteResponse,
  NotesListResponse,
  UpdateNoteRequest,
} from '@encrypted-notes/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Note } from '../../entities/note.entity';
import { NoteTag } from '../../entities/note-tag.entity';
import { NoteTerm } from '../../entities/note-term.entity';
import { Tag } from '../../entities/tag.entity';
import { TagTerm } from '../../entities/tag-term.entity';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private _noteRepository: Repository<Note>,
    @InjectRepository(NoteTerm)
    private _noteTermRepository: Repository<NoteTerm>,
    @InjectRepository(NoteTag)
    private _noteTagRepository: Repository<NoteTag>,
    @InjectRepository(Tag)
    private _tagRepository: Repository<Tag>,
    @InjectRepository(TagTerm)
    private _tagTermRepository: Repository<TagTerm>
  ) {}

  async create(
    ownerId: string,
    createData: CreateNoteRequest
  ): Promise<NoteResponse> {
    const { titleCt, ivTitle, bodyCt, ivBody, termHashes, tags } = createData;

    // Create the note
    const note = this._noteRepository.create({
      ownerId,
      titleCt: Buffer.from(titleCt),
      bodyCt: Buffer.from(bodyCt),
      ivTitle: Buffer.from(ivTitle),
      ivBody: Buffer.from(ivBody),
    });

    const savedNote = await this._noteRepository.save(note);

    // Create search terms for blind indexing
    if (termHashes && termHashes.length > 0) {
      const noteTerms = termHashes.map((termHash) =>
        this._noteTermRepository.create({
          noteId: savedNote.id,
          termHash: Buffer.from(termHash),
        })
      );
      await this._noteTermRepository.save(noteTerms);
    }

    // Handle tags if provided
    if (tags && tags.length > 0) {
      for (const tagData of tags) {
        // Find or create tag
        let tag = await this._tagRepository.findOne({
          where: {
            ownerId,
            tagCt: Buffer.from(tagData.tagCt),
            ivTag: Buffer.from(tagData.ivTag),
          },
        });

        if (!tag) {
          tag = this._tagRepository.create({
            ownerId,
            tagCt: Buffer.from(tagData.tagCt),
            ivTag: Buffer.from(tagData.ivTag),
          });
          tag = await this._tagRepository.save(tag);

          // Create tag search terms
          if (tagData.tagTermHashes && tagData.tagTermHashes.length > 0) {
            const tagTerms = tagData.tagTermHashes.map((termHash) =>
              this._tagTermRepository.create({
                tagId: tag!.id,
                termHash: Buffer.from(termHash),
              })
            );
            await this._tagTermRepository.save(tagTerms);
          }
        }

        // Link note to tag
        const noteTag = this._noteTagRepository.create({
          noteId: savedNote.id,
          tagId: tag!.id,
        });
        await this._noteTagRepository.save(noteTag);
      }
    }

    // Handle tags if provided
    if (tags && tags.length > 0) {
      for (const tagData of tags) {
        // Find or create tag
        let tag = await this._tagRepository.findOne({
          where: {
            ownerId,
            tagCt: Buffer.from(tagData.tagCt),
            ivTag: Buffer.from(tagData.ivTag),
          },
        });

        if (!tag) {
          tag = this._tagRepository.create({
            ownerId,
            tagCt: Buffer.from(tagData.tagCt),
            ivTag: Buffer.from(tagData.ivTag),
          });
          tag = await this._tagRepository.save(tag);

          // Create tag search terms
          if (tagData.tagTermHashes && tagData.tagTermHashes.length > 0) {
            const tagTerms = tagData.tagTermHashes.map((termHash) =>
              this._tagTermRepository.create({
                tagId: tag!.id,
                termHash: Buffer.from(termHash),
              })
            );
            await this._tagTermRepository.save(tagTerms);
          }
        }

        // Link note to tag
        const noteTag = this._noteTagRepository.create({
          noteId: savedNote.id,
          tagId: tag!.id,
        });
        await this._noteTagRepository.save(noteTag);
      }
    }

    return {
      id: savedNote.id,
      titleCt: new Uint8Array(savedNote.titleCt),
      ivTitle: new Uint8Array(savedNote.ivTitle),
      bodyCt: new Uint8Array(savedNote.bodyCt),
      ivBody: new Uint8Array(savedNote.ivBody),
      created_at: savedNote.createdAt,
      updated_at: savedNote.updatedAt,
    };
  }

  async findAll(
    ownerId: string,
    limit = 50,
    cursor?: string
  ): Promise<NotesListResponse> {
    const query = this._noteRepository
      .createQueryBuilder('note')
      .where('note.ownerId = :ownerId', { ownerId })
      .orderBy('note.updatedAt', 'DESC')
      .take(limit + 1); // Take one extra to check if there are more

    if (cursor) {
      query.andWhere('note.updatedAt < :cursor', { cursor: new Date(cursor) });
    }

    const notes = await query.getMany();

    const hasNextPage = notes.length > limit;
    const notesToReturn = hasNextPage ? notes.slice(0, limit) : notes;

    const nextCursor = hasNextPage
      ? notes[limit - 1].updatedAt.toISOString()
      : undefined;

    return {
      notes: notesToReturn.map((note) => ({
        id: note.id,
        created_at: note.createdAt,
        updated_at: note.updatedAt,
      })),
      nextCursor,
    };
  }

  async findOne(ownerId: string, noteId: string): Promise<NoteResponse> {
    const note = await this._noteRepository.findOne({
      where: { id: noteId, ownerId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return {
      id: note.id,
      titleCt: new Uint8Array(note.titleCt),
      ivTitle: new Uint8Array(note.ivTitle),
      bodyCt: new Uint8Array(note.bodyCt),
      ivBody: new Uint8Array(note.ivBody),
      created_at: note.createdAt,
      updated_at: note.updatedAt,
    };
  }

  async findByIds(
    ownerId: string,
    noteIds: string[]
  ): Promise<BatchNotesResponse> {
    const notes = await this._noteRepository
      .createQueryBuilder('note')
      .where('note.ownerId = :ownerId', { ownerId })
      .andWhere('note.id IN (:...noteIds)', { noteIds })
      .getMany();

    return notes.map((note) => ({
      id: note.id,
      titleCt: new Uint8Array(note.titleCt),
      ivTitle: new Uint8Array(note.ivTitle),
      bodyCt: new Uint8Array(note.bodyCt),
      ivBody: new Uint8Array(note.ivBody),
      created_at: note.createdAt,
      updated_at: note.updatedAt,
    }));
  }

  async update(
    ownerId: string,
    noteId: string,
    updateData: UpdateNoteRequest
  ): Promise<NoteResponse> {
    const note = await this._noteRepository.findOne({
      where: { id: noteId, ownerId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Update encrypted content
    if (updateData.titleCt) note.titleCt = Buffer.from(updateData.titleCt);
    if (updateData.ivTitle) note.ivTitle = Buffer.from(updateData.ivTitle);
    if (updateData.bodyCt) note.bodyCt = Buffer.from(updateData.bodyCt);
    if (updateData.ivBody) note.ivBody = Buffer.from(updateData.ivBody);

    const updatedNote = await this._noteRepository.save(note);

    // Update search terms if provided
    if (updateData.termHashes) {
      // Remove existing terms
      await this._noteTermRepository.delete({ noteId });

      // Add new terms
      if (updateData.termHashes.length > 0) {
        const noteTerms = updateData.termHashes.map((termHash) =>
          this._noteTermRepository.create({
            noteId,
            termHash: Buffer.from(termHash),
          })
        );
        await this._noteTermRepository.save(noteTerms);
      }
    }

    return {
      id: updatedNote.id,
      titleCt: new Uint8Array(updatedNote.titleCt),
      ivTitle: new Uint8Array(updatedNote.ivTitle),
      bodyCt: new Uint8Array(updatedNote.bodyCt),
      ivBody: new Uint8Array(updatedNote.ivBody),
      created_at: updatedNote.createdAt,
      updated_at: updatedNote.updatedAt,
    };
  }

  async remove(ownerId: string, noteId: string): Promise<void> {
    const note = await this._noteRepository.findOne({
      where: { id: noteId, ownerId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Delete will cascade to note_terms and note_tags due to entity relationships
    await this._noteRepository.remove(note);
  }

  async search(
    ownerId: string,
    termHashes: Uint8Array[],
    limit = 50
  ): Promise<NotesListResponse> {
    const notes = await this._noteRepository
      .createQueryBuilder('note')
      .innerJoin('note.terms', 'term')
      .where('note.ownerId = :ownerId', { ownerId })
      .andWhere('term.termHash IN (:...termHashes)', {
        termHashes: termHashes.map((hash) => Buffer.from(hash)),
      })
      .orderBy('note.updatedAt', 'DESC')
      .take(limit)
      .getMany();

    return {
      notes: notes.map((note) => ({
        id: note.id,
        created_at: note.createdAt,
        updated_at: note.updatedAt,
      })),
      nextCursor: undefined, // For now, no pagination on search
    };
  }
}
