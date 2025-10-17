import { z } from 'zod';

export const SearchRequestSchema = z.object({
  termHashes: z.array(z.instanceof(Uint8Array)),
  mode: z.enum(['all', 'tags', 'notes']).optional().default('all'),
  limit: z.number().min(1).max(100).optional().default(50),
  cursor: z.string().optional(),
  sort: z.enum(['created_at', 'updated_at']).optional().default('updated_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const SearchResponseSchema = z.object({
  notes: z.array(
    z.object({
      id: z.string().uuid(),
      created_at: z.date(),
      updated_at: z.date(),
    })
  ),
  nextCursor: z.string().optional(),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
