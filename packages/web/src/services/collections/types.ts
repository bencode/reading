import type { Tag, PaginatedResponse, ArticleReference } from '../types';

// Re-export shared types
export type { Tag, PaginatedResponse, ArticleReference };

export type CollectionStatus = 'draft' | 'published' | 'archived';
export type CollectionFormStatus = 'draft' | 'published';

export type Collection = {
  id: number;
  title: string;
  description: string | null;
  cover_image: string | null;
  status: CollectionStatus;
  created_at: string;
  published_at: string | null;
  updated_at: string;
  sections?: CollectionSection[];
}

export type CollectionSection = {
  id: number;
  collection_id: number;
  article_id: number;
  title: string | null;
  description: string | null;
  image: string | null;
  external_url: string | null;
  order_index: number;
  created_at: string;
  tags: Tag[];
  tag_names?: string[]; // For form updates
  article?: ArticleReference;
}

export type CreateCollectionData = {
  title: string;
  description?: string;
  cover_image?: string;
  status?: CollectionFormStatus;
}

export type CreateCollectionSectionData = {
  article_id: number;
  title?: string;
  description?: string;
  image?: string;
  external_url?: string;
  order_index?: number;
  tag_names?: string[];
}

export type UpdateCollectionData = {
  title?: string;
  description?: string;
  cover_image?: string;
  status?: CollectionStatus;
}

export type UpdateCollectionSectionData = {
  title?: string;
  description?: string;
  image?: string;
  external_url?: string;
  order_index?: number;
  tag_names?: string[];
}