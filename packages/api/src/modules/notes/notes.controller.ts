import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
  };
}

import {
  BatchNotesRequest,
  BatchNotesResponse,
  CreateNoteRequest,
  NoteResponse,
  NotesListResponse,
  UpdateNoteRequest,
} from '@encrypted-notes/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { NotesService } from './notes.service';

@ApiTags('notes')
@ApiBearerAuth()
@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly _notesService: NotesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new note' })
  @ApiResponse({ status: 201, description: 'Note created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() createNoteData: CreateNoteRequest
  ): Promise<NoteResponse> {
    return this._notesService.create(req.user.userId, createNoteData);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated list of notes' })
  @ApiResponse({ status: 200, description: 'Notes retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string
  ): Promise<NotesListResponse> {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this._notesService.findAll(req.user.userId, limitNum, cursor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific note by ID' })
  @ApiResponse({ status: 200, description: 'Note retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id') noteId: string
  ): Promise<NoteResponse> {
    return this._notesService.findOne(req.user.userId, noteId);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Get multiple notes by IDs' })
  @ApiResponse({ status: 200, description: 'Notes retrieved successfully' })
  async findByIds(
    @Request() req: AuthenticatedRequest,
    @Body() batchRequest: BatchNotesRequest
  ): Promise<BatchNotesResponse> {
    return this._notesService.findByIds(req.user.userId, batchRequest.ids);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a note' })
  @ApiResponse({ status: 200, description: 'Note updated successfully' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') noteId: string,
    @Body() updateNoteData: UpdateNoteRequest
  ): Promise<NoteResponse> {
    return this._notesService.update(req.user.userId, noteId, updateNoteData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a note' })
  @ApiResponse({ status: 204, description: 'Note deleted successfully' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async remove(
    @Request() req: AuthenticatedRequest,
    @Param('id') noteId: string
  ): Promise<void> {
    return this._notesService.remove(req.user.userId, noteId);
  }

  @Post('search')
  @ApiOperation({ summary: 'Search notes using blind indexing' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(
    @Request() req: AuthenticatedRequest,
    @Body() termHashes: Uint8Array[],
    @Query('limit') limit?: string
  ): Promise<NotesListResponse> {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this._notesService.search(req.user.userId, termHashes, limitNum);
  }
}
