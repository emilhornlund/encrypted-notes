import { z } from 'zod';

export const CreateNoteRequestSchema = z.object({
  titleCt: z.instanceof(Uint8Array),
  ivTitle: z.instanceof(Uint8Array),
  bodyCt: z.instanceof(Uint8Array),
  ivBody: z.instanceof(Uint8Array),
  termHashes: z.array(z.instanceof(Uint8Array)),
  tags: z.array(z.object({
    tagCt: z.instanceof(Uint8Array),
    ivTag: z.instanceof(Uint8Array),
    tagTermHashes: z.array(z.instanceof(Uint8Array)),
  })).optional(),
});

export const UpdateNoteRequestSchema = z.object({
  titleCt: z.instanceof(Uint8Array).optional(),
  ivTitle: z.instanceof(Uint8Array).optional(),
  bodyCt: z.instanceof(Uint8Array).optional(),
  ivBody: z.instanceof(Uint8Array).optional(),
  termHashes: z.array(z.instanceof(Uint8Array)).optional(),
});

export const BatchNotesRequestSchema = z.object({
  ids: z.array(z.string().uuid()),
});

export const NoteResponseSchema = z.object({
  id: z.string().uuid(),
  titleCt: z.instanceof(Uint8Array),
  ivTitle: z.instanceof(Uint8Array),
  bodyCt: z.instanceof(Uint8Array),
  ivBody: z.instanceof(Uint8Array),
  created_at: z.date(),
  updated_at: z.date(),
});

export const BatchNotesResponseSchema = z.array(NoteResponseSchema);

export const NotesListResponseSchema = z.object({
  notes: z.array(z.object({
    id: z.string().uuid(),
    created_at: z.date(),
    updated_at: z.date(),
  })),
  nextCursor: z.string().optional(),
});

export type CreateNoteRequest = z.infer<typeof CreateNoteRequestSchema>;
export type UpdateNoteRequest = z.infer<typeof UpdateNoteRequestSchema>;
export type BatchNotesRequest = z.infer<typeof BatchNotesRequestSchema>;
export type NoteResponse = z.infer<typeof NoteResponseSchema>;
export type BatchNotesResponse = z.infer<typeof BatchNotesResponseSchema>;
export type NotesListResponse = z.infer<typeof NotesListResponseSchema>;