/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BatchNotesRequest,
  CreateNoteRequest,
  UpdateNoteRequest,
} from '@encrypted-notes/common';
import { Test, TestingModule } from '@nestjs/testing';

import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

describe('NotesController', () => {
  let controller: NotesController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _notesService: NotesService;

  const mockNotesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByIds: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    search: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [
        {
          provide: NotesService,
          useValue: mockNotesService,
        },
      ],
    }).compile();

    controller = module.get<NotesController>(NotesController);
    _notesService = module.get<NotesService>(NotesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a note', async () => {
      const createData: CreateNoteRequest = {
        titleCt: new Uint8Array([1, 2, 3]),
        ivTitle: new Uint8Array([4, 5, 6]),
        bodyCt: new Uint8Array([7, 8, 9]),
        ivBody: new Uint8Array([10, 11, 12]),
        termHashes: [],
        tags: [],
      };
      const mockRequest = {
        user: { userId: 'user-id' },
      } as any;
      const expectedResult = {
        id: 'note-id',
        ...createData,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockNotesService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(mockRequest, createData);

      expect(mockNotesService.create).toHaveBeenCalledWith(
        'user-id',
        createData
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return paginated notes', async () => {
      const mockRequest = {
        user: { userId: 'user-id' },
      } as any;
      const expectedResult = {
        notes: [
          { id: 'note-1', created_at: new Date(), updated_at: new Date() },
        ],
        nextCursor: undefined as string | undefined,
      };

      mockNotesService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(mockRequest);

      expect(mockNotesService.findAll).toHaveBeenCalledWith(
        'user-id',
        50,
        undefined
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle limit and cursor query parameters', async () => {
      const mockRequest = {
        user: { userId: 'user-id' },
      } as any;
      const expectedResult = {
        notes: [
          { id: 'note-1', created_at: new Date(), updated_at: new Date() },
        ],
        nextCursor: undefined as string | undefined,
      };

      mockNotesService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(
        mockRequest,
        '10',
        'cursor-token'
      );

      expect(mockNotesService.findAll).toHaveBeenCalledWith(
        'user-id',
        10,
        'cursor-token'
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a specific note', async () => {
      const mockRequest = {
        user: { userId: 'user-id' },
      } as any;
      const noteId = 'note-id';
      const expectedResult = {
        id: noteId,
        titleCt: new Uint8Array([1, 2, 3]),
        ivTitle: new Uint8Array([4, 5, 6]),
        bodyCt: new Uint8Array([7, 8, 9]),
        ivBody: new Uint8Array([10, 11, 12]),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockNotesService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(mockRequest, noteId);

      expect(mockNotesService.findOne).toHaveBeenCalledWith('user-id', noteId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findByIds', () => {
    it('should return multiple notes by IDs', async () => {
      const mockRequest = {
        user: { userId: 'user-id' },
      } as any;
      const batchRequest: BatchNotesRequest = { ids: ['note-1', 'note-2'] };
      const expectedResult = [
        {
          id: 'note-1',
          titleCt: new Uint8Array([1, 2, 3]),
          ivTitle: new Uint8Array([4, 5, 6]),
          bodyCt: new Uint8Array([7, 8, 9]),
          ivBody: new Uint8Array([10, 11, 12]),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockNotesService.findByIds.mockResolvedValue(expectedResult);

      const result = await controller.findByIds(mockRequest, batchRequest);

      expect(mockNotesService.findByIds).toHaveBeenCalledWith(
        'user-id',
        batchRequest.ids
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a note', async () => {
      const mockRequest = {
        user: { userId: 'user-id' },
      } as any;
      const noteId = 'note-id';
      const updateData: UpdateNoteRequest = {
        titleCt: new Uint8Array([1, 2, 3]),
        ivTitle: new Uint8Array([4, 5, 6]),
      };
      const expectedResult = {
        id: noteId,
        titleCt: new Uint8Array([1, 2, 3]),
        ivTitle: new Uint8Array([4, 5, 6]),
        bodyCt: new Uint8Array([7, 8, 9]),
        ivBody: new Uint8Array([10, 11, 12]),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockNotesService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(mockRequest, noteId, updateData);

      expect(mockNotesService.update).toHaveBeenCalledWith(
        'user-id',
        noteId,
        updateData
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete a note', async () => {
      const mockRequest = {
        user: { userId: 'user-id' },
      } as any;
      const noteId = 'note-id';

      mockNotesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockRequest, noteId);

      expect(mockNotesService.remove).toHaveBeenCalledWith('user-id', noteId);
      expect(result).toBeUndefined();
    });
  });

  describe('search', () => {
    it('should search notes by term hashes', async () => {
      const mockRequest = {
        user: { userId: 'user-id' },
      } as any;
      const termHashes = [new Uint8Array([1, 2, 3])];
      const expectedResult = {
        notes: [
          { id: 'note-1', created_at: new Date(), updated_at: new Date() },
        ],
        nextCursor: undefined as string | undefined,
      };

      mockNotesService.search.mockResolvedValue(expectedResult);

      const result = await controller.search(mockRequest, termHashes);

      expect(mockNotesService.search).toHaveBeenCalledWith(
        'user-id',
        termHashes,
        50
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle limit query parameter', async () => {
      const mockRequest = {
        user: { userId: 'user-id' },
      } as any;
      const termHashes = [new Uint8Array([1, 2, 3])];
      const expectedResult = {
        notes: [
          { id: 'note-1', created_at: new Date(), updated_at: new Date() },
        ],
        nextCursor: undefined as string | undefined,
      };

      mockNotesService.search.mockResolvedValue(expectedResult);

      const result = await controller.search(mockRequest, termHashes, '25');

      expect(mockNotesService.search).toHaveBeenCalledWith(
        'user-id',
        termHashes,
        25
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
