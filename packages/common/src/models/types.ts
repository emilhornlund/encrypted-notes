export type SortOrder = 'asc' | 'desc';
export type SortField = 'created_at' | 'updated_at';
export type SearchMode = 'all' | 'tags' | 'notes';

export interface PaginationOptions {
  limit?: number;
  cursor?: string;
  sort?: SortField;
  order?: SortOrder;
}

export interface SearchOptions extends PaginationOptions {
  mode?: SearchMode;
}