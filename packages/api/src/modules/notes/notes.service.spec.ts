import { CreateNoteRequest, UpdateNoteRequest } from '@encrypted-notes/common';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Note } from '../../entities/note.entity';
import { NoteTag } from '../../entities/note-tag.entity';
import { NoteTerm } from '../../entities/note-term.entity';
import { Tag } from '../../entities/tag.entity';
import { TagTerm } from '../../entities/tag-term.entity';
import { NotesService } from './notes.service';

describe('NotesService', () => {
  let service: NotesService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _noteRepository: Repository<Note>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _noteTermRepository: Repository<NoteTerm>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _noteTagRepository: Repository<NoteTag>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _tagRepository: Repository<Tag>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _tagTermRepository: Repository<TagTerm>;

  const mockNoteRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
  };

  const mockNoteTermRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockNoteTagRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTagRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTagTermRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        {
          provide: getRepositoryToken(Note),
          useValue: mockNoteRepository,
        },
        {
          provide: getRepositoryToken(NoteTerm),
          useValue: mockNoteTermRepository,
        },
        {
          provide: getRepositoryToken(NoteTag),
          useValue: mockNoteTagRepository,
        },
        {
          provide: getRepositoryToken(Tag),
          useValue: mockTagRepository,
        },
        {
          provide: getRepositoryToken(TagTerm),
          useValue: mockTagTermRepository,
        },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    _noteRepository = module.get<Repository<Note>>(getRepositoryToken(Note));
    _noteTermRepository = module.get<Repository<NoteTerm>>(
      getRepositoryToken(NoteTerm)
    );
    _noteTagRepository = module.get<Repository<NoteTag>>(
      getRepositoryToken(NoteTag)
    );
    _tagRepository = module.get<Repository<Tag>>(getRepositoryToken(Tag));
    _tagTermRepository = module.get<Repository<TagTerm>>(
      getRepositoryToken(TagTerm)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const ownerId = 'user-id';
    const createData: CreateNoteRequest = {
      titleCt: new Uint8Array([1, 2, 3]),
      ivTitle: new Uint8Array([4, 5, 6]),
      bodyCt: new Uint8Array([7, 8, 9]),
      ivBody: new Uint8Array([10, 11, 12]),
      termHashes: [new Uint8Array([13, 14, 15])],
      tags: [
        {
          tagCt: new Uint8Array([16, 17, 18]),
          ivTag: new Uint8Array([19, 20, 21]),
          tagTermHashes: [new Uint8Array([22, 23, 24])],
        },
      ],
    };

    it('should create a note without tags and terms', async () => {
      const simpleCreateData: CreateNoteRequest = {
        titleCt: new Uint8Array([1, 2, 3]),
        ivTitle: new Uint8Array([4, 5, 6]),
        bodyCt: new Uint8Array([7, 8, 9]),
        ivBody: new Uint8Array([10, 11, 12]),
        termHashes: [],
        tags: [],
      };

      const mockNote = {
        id: 'note-id',
        titleCt: Buffer.from(simpleCreateData.titleCt),
        bodyCt: Buffer.from(simpleCreateData.bodyCt),
        ivTitle: Buffer.from(simpleCreateData.ivTitle),
        ivBody: Buffer.from(simpleCreateData.ivBody),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNoteRepository.create.mockReturnValue(mockNote);
      mockNoteRepository.save.mockResolvedValue(mockNote);

      const result = await service.create(ownerId, simpleCreateData);

      expect(mockNoteRepository.create).toHaveBeenCalledWith({
        ownerId,
        titleCt: Buffer.from(simpleCreateData.titleCt),
        bodyCt: Buffer.from(simpleCreateData.bodyCt),
        ivTitle: Buffer.from(simpleCreateData.ivTitle),
        ivBody: Buffer.from(simpleCreateData.ivBody),
      });
      expect(result.id).toBe(mockNote.id);
      expect(result.titleCt).toEqual(simpleCreateData.titleCt);
    });

    it('should create a note with search terms', async () => {
      const createDataWithTerms: CreateNoteRequest = {
        ...createData,
        tags: [],
      };

      const mockNote = {
        id: 'note-id',
        titleCt: Buffer.from(createDataWithTerms.titleCt),
        bodyCt: Buffer.from(createDataWithTerms.bodyCt),
        ivTitle: Buffer.from(createDataWithTerms.ivTitle),
        ivBody: Buffer.from(createDataWithTerms.ivBody),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNoteRepository.create.mockReturnValue(mockNote);
      mockNoteRepository.save.mockResolvedValue(mockNote);
      mockNoteTermRepository.create.mockReturnValue({ noteId: mockNote.id });
      mockNoteTermRepository.save.mockResolvedValue([]);

      await service.create(ownerId, createDataWithTerms);

      expect(mockNoteTermRepository.create).toHaveBeenCalledWith({
        noteId: mockNote.id,
        termHash: Buffer.from(createDataWithTerms.termHashes![0]),
      });
      expect(mockNoteTermRepository.save).toHaveBeenCalled();
    });

    it('should create a note with new tags', async () => {
      const createDataWithTags: CreateNoteRequest = {
        ...createData,
        termHashes: [],
      };

      const mockNote = {
        id: 'note-id',
        titleCt: Buffer.from(createDataWithTags.titleCt),
        bodyCt: Buffer.from(createDataWithTags.bodyCt),
        ivTitle: Buffer.from(createDataWithTags.ivTitle),
        ivBody: Buffer.from(createDataWithTags.ivBody),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTag = {
        id: 'tag-id',
        tagCt: Buffer.from(createDataWithTags.tags![0].tagCt),
        ivTag: Buffer.from(createDataWithTags.tags![0].ivTag),
      };

      mockNoteRepository.create.mockReturnValue(mockNote);
      mockNoteRepository.save.mockResolvedValue(mockNote);
      mockTagRepository.findOne.mockResolvedValue(null);
      mockTagRepository.create.mockReturnValue(mockTag);
      mockTagRepository.save.mockResolvedValue(mockTag);
      mockTagTermRepository.create.mockReturnValue({ tagId: mockTag.id });
      mockTagTermRepository.save.mockResolvedValue([]);
      mockNoteTagRepository.create.mockReturnValue({
        noteId: mockNote.id,
        tagId: mockTag.id,
      });
      mockNoteTagRepository.save.mockResolvedValue({});

      await service.create(ownerId, createDataWithTags);

      expect(mockTagRepository.findOne).toHaveBeenCalledWith({
        where: {
          ownerId,
          tagCt: Buffer.from(createDataWithTags.tags![0].tagCt),
          ivTag: Buffer.from(createDataWithTags.tags![0].ivTag),
        },
      });
      expect(mockTagRepository.create).toHaveBeenCalled();
      expect(mockNoteTagRepository.create).toHaveBeenCalledWith({
        noteId: mockNote.id,
        tagId: mockTag.id,
      });
    });

    it('should reuse existing tags', async () => {
      const createDataWithTags: CreateNoteRequest = {
        ...createData,
        termHashes: [],
      };

      const mockNote = {
        id: 'note-id',
        titleCt: Buffer.from(createDataWithTags.titleCt),
        bodyCt: Buffer.from(createDataWithTags.bodyCt),
        ivTitle: Buffer.from(createDataWithTags.ivTitle),
        ivBody: Buffer.from(createDataWithTags.ivBody),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const existingTag = {
        id: 'existing-tag-id',
        tagCt: Buffer.from(createDataWithTags.tags![0].tagCt),
        ivTag: Buffer.from(createDataWithTags.tags![0].ivTag),
      };

      mockNoteRepository.create.mockReturnValue(mockNote);
      mockNoteRepository.save.mockResolvedValue(mockNote);
      mockTagRepository.findOne.mockResolvedValue(existingTag);
      mockNoteTagRepository.create.mockReturnValue({
        noteId: mockNote.id,
        tagId: existingTag.id,
      });
      mockNoteTagRepository.save.mockResolvedValue({});

      await service.create(ownerId, createDataWithTags);

      expect(mockTagRepository.create).not.toHaveBeenCalled();
      expect(mockTagTermRepository.create).not.toHaveBeenCalled();
      expect(mockNoteTagRepository.create).toHaveBeenCalledWith({
        noteId: mockNote.id,
        tagId: existingTag.id,
      });
    });
  });

  describe('findAll', () => {
    const ownerId = 'user-id';

    it('should return paginated notes', async () => {
      const mockNotes = [
        { id: 'note-1', createdAt: new Date(), updatedAt: new Date() },
        { id: 'note-2', createdAt: new Date(), updatedAt: new Date() },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockNotes),
      };

      mockNoteRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(ownerId, 10);

      expect(mockNoteRepository.createQueryBuilder).toHaveBeenCalledWith(
        'note'
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'note.ownerId = :ownerId',
        { ownerId }
      );
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(11);
      expect(result.notes).toHaveLength(2);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should handle cursor pagination', async () => {
      const cursor = '2023-01-01T00:00:00.000Z';
      const mockNotes = [
        { id: 'note-1', createdAt: new Date(), updatedAt: new Date() },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockNotes),
      };

      mockNoteRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll(ownerId, 10, cursor);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'note.updatedAt < :cursor',
        {
          cursor: new Date(cursor),
        }
      );
    });
  });

  describe('findOne', () => {
    const ownerId = 'user-id';
    const noteId = 'note-id';

    it('should return a note if found', async () => {
      const mockNote = {
        id: noteId,
        titleCt: Buffer.from([1, 2, 3]),
        bodyCt: Buffer.from([4, 5, 6]),
        ivTitle: Buffer.from([7, 8, 9]),
        ivBody: Buffer.from([10, 11, 12]),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNoteRepository.findOne.mockResolvedValue(mockNote);

      const result = await service.findOne(ownerId, noteId);

      expect(mockNoteRepository.findOne).toHaveBeenCalledWith({
        where: { id: noteId, ownerId },
      });
      expect(result.id).toBe(noteId);
      expect(result.titleCt).toEqual(new Uint8Array([1, 2, 3]));
    });

    it('should throw NotFoundException if note not found', async () => {
      mockNoteRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(ownerId, noteId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('findByIds', () => {
    const ownerId = 'user-id';
    const noteIds = ['note-1', 'note-2'];

    it('should return multiple notes by IDs', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          titleCt: Buffer.from([1, 2, 3]),
          bodyCt: Buffer.from([4, 5, 6]),
          ivTitle: Buffer.from([7, 8, 9]),
          ivBody: Buffer.from([10, 11, 12]),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockNotes),
      };

      mockNoteRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByIds(ownerId, noteIds);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'note.ownerId = :ownerId',
        { ownerId }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'note.id IN (:...noteIds)',
        { noteIds }
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    const ownerId = 'user-id';
    const noteId = 'note-id';
    const updateData: UpdateNoteRequest = {
      titleCt: new Uint8Array([1, 2, 3]),
      ivTitle: new Uint8Array([4, 5, 6]),
      bodyCt: new Uint8Array([7, 8, 9]),
      ivBody: new Uint8Array([10, 11, 12]),
      termHashes: [new Uint8Array([13, 14, 15])],
    };

    it('should update a note', async () => {
      const existingNote = {
        id: noteId,
        titleCt: Buffer.from([0, 0, 0]),
        bodyCt: Buffer.from([0, 0, 0]),
        ivTitle: Buffer.from([0, 0, 0]),
        ivBody: Buffer.from([0, 0, 0]),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedNote = { ...existingNote, ...updateData };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockResolvedValue(updatedNote);
      mockNoteTermRepository.delete.mockResolvedValue(undefined);
      mockNoteTermRepository.create.mockReturnValue({ noteId });
      mockNoteTermRepository.save.mockResolvedValue([]);

      const result = await service.update(ownerId, noteId, updateData);

      expect(mockNoteRepository.findOne).toHaveBeenCalledWith({
        where: { id: noteId, ownerId },
      });
      expect(mockNoteRepository.save).toHaveBeenCalled();
      expect(result.titleCt).toEqual(updateData.titleCt);
    });

    it('should update search terms', async () => {
      const existingNote = {
        id: noteId,
        titleCt: Buffer.from([0, 0, 0]),
        bodyCt: Buffer.from([0, 0, 0]),
        ivTitle: Buffer.from([0, 0, 0]),
        ivBody: Buffer.from([0, 0, 0]),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockResolvedValue(existingNote);
      mockNoteTermRepository.delete.mockResolvedValue(undefined);
      mockNoteTermRepository.create.mockReturnValue({ noteId });
      mockNoteTermRepository.save.mockResolvedValue([]);

      await service.update(ownerId, noteId, updateData);

      expect(mockNoteTermRepository.delete).toHaveBeenCalledWith({ noteId });
      expect(mockNoteTermRepository.create).toHaveBeenCalledWith({
        noteId,
        termHash: Buffer.from(updateData.termHashes![0]),
      });
    });

    it('should throw NotFoundException if note not found', async () => {
      mockNoteRepository.findOne.mockResolvedValue(null);

      await expect(service.update(ownerId, noteId, updateData)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    const ownerId = 'user-id';
    const noteId = 'note-id';

    it('should delete a note', async () => {
      const mockNote = { id: noteId };

      mockNoteRepository.findOne.mockResolvedValue(mockNote);
      mockNoteRepository.remove.mockResolvedValue(undefined);

      await service.remove(ownerId, noteId);

      expect(mockNoteRepository.findOne).toHaveBeenCalledWith({
        where: { id: noteId, ownerId },
      });
      expect(mockNoteRepository.remove).toHaveBeenCalledWith(mockNote);
    });

    it('should throw NotFoundException if note not found', async () => {
      mockNoteRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(ownerId, noteId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('search', () => {
    const ownerId = 'user-id';
    const termHashes = [new Uint8Array([1, 2, 3])];

    it('should search notes by term hashes', async () => {
      const mockNotes = [
        { id: 'note-1', createdAt: new Date(), updatedAt: new Date() },
      ];

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockNotes),
      };

      mockNoteRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.search(ownerId, termHashes, 10);

      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'note.terms',
        'term'
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'note.ownerId = :ownerId',
        { ownerId }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'term.termHash IN (:...termHashes)',
        {
          termHashes: [Buffer.from(termHashes[0])],
        }
      );
      expect(result.notes).toHaveLength(1);
    });
  });
});
