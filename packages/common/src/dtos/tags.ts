import { z } from 'zod';

export const AddTagRequestSchema = z.object({
  tagCt: z.instanceof(Uint8Array),
  ivTag: z.instanceof(Uint8Array),
  tagTermHashes: z.array(z.instanceof(Uint8Array)),
});

export const TagResponseSchema = z.object({
  id: z.string().uuid(),
  tagCt: z.instanceof(Uint8Array),
  ivTag: z.instanceof(Uint8Array),
  created_at: z.date(),
});

export const TagsListResponseSchema = z.object({
  tags: z.array(TagResponseSchema),
  nextCursor: z.string().optional(),
});

export type AddTagRequest = z.infer<typeof AddTagRequestSchema>;
export type TagResponse = z.infer<typeof TagResponseSchema>;
export type TagsListResponse = z.infer<typeof TagsListResponseSchema>;