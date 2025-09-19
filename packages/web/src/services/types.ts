// Shared types used across different service modules

export type Tag = {
  id: number;
  name: string;
}

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Article reference type - minimal fields needed by collections
export type ArticleReference = {
  id: number;
  title: string;
  summary: string;
  original_url: string;
  source_name: string;
  published_at: string;
}