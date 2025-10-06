import type { Tag, PaginatedResponse } from '../types';

export interface Article {
  id: number;
  title: string;
  original_url: string;
  summary: string;
  source_name: string;
  published_at: string;
  created_at: string;
  is_read: boolean;
  is_skipped: boolean;
  starred: boolean;
  rating: number | null;
  deleted: boolean;
  note: string | null;
  tags: Tag[];
}

export interface Category {
  id: number;
  name: string;
  priority?: number;
}

export interface ArticleFilters {
  categoryId?: number;
  starred?: boolean;
  read?: boolean;
  skip?: boolean;
  deleted?: boolean;
  search?: string;
}

export interface CreateArticleData {
  title: string;
  original_url: string;
  summary: string;
  source_name: string;
  published_at: string;
  category_name?: string;
  tag_names?: string[];
}

// Re-export shared types
export type { Tag, PaginatedResponse };
