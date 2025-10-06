import { getDb } from '../lib/db';
import type { Tag, PaginatedResponse } from './types';
import type { Knex } from 'knex';

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

// Re-export shared types for backward compatibility
export type { Tag, PaginatedResponse } from './types';

export async function getCategories(): Promise<Category[]> {
  const db = getDb();
  const categories = await db('categories')
    .select('id', 'name', 'priority')
    .orderBy('priority', 'asc')
    .orderBy('name', 'asc');
  return categories;
}

export interface ArticleFilters {
  categoryId?: number;
  starred?: boolean;
  read?: boolean;
  skip?: boolean;
  deleted?: boolean;
  search?: string;
}

export async function getArticles(
  filters: ArticleFilters = {}, 
  page: number = 1, 
  limit: number = 12
): Promise<PaginatedResponse<Article>> {
  const db = getDb();
  
  // Build base query
  let query = db('articles as a').select('a.*');
  let countQuery = db('articles as a');
  
  // Add category join if needed
  if (filters.categoryId) {
    query = query.join('article_categories as ac', 'a.id', 'ac.article_id');
    countQuery = countQuery.join('article_categories as ac', 'a.id', 'ac.article_id');
    
    query = query.where('ac.category_id', filters.categoryId);
    countQuery = countQuery.where('ac.category_id', filters.categoryId);
  }
  
  // Default: exclude deleted articles unless explicitly requested
  if (filters.deleted === true) {
    query = query.where('a.deleted', true);
    countQuery = countQuery.where('a.deleted', true);
  } else if (filters.deleted !== false) {
    query = query.where('a.deleted', false);
    countQuery = countQuery.where('a.deleted', false);
  }
  
  // Filter by starred status
  if (filters.starred === true) {
    query = query.where('a.starred', true);
    countQuery = countQuery.where('a.starred', true);
  } else if (filters.starred === false) {
    query = query.where('a.starred', false);
    countQuery = countQuery.where('a.starred', false);
  }
  
  // Filter by read status
  if (filters.read === true) {
    query = query.where('a.is_read', true);
    countQuery = countQuery.where('a.is_read', true);
  } else if (filters.read === false) {
    query = query.where('a.is_read', false);
    countQuery = countQuery.where('a.is_read', false);
  }
  
  // Filter by skip status
  if (filters.skip === true) {
    query = query.where('a.is_skipped', true);
    countQuery = countQuery.where('a.is_skipped', true);
  } else if (filters.skip === false) {
    query = query.where('a.is_skipped', false);
    countQuery = countQuery.where('a.is_skipped', false);
  }
  
  // Filter by search term
  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.where(function() {
      this.where('a.title', 'like', searchTerm)
          .orWhere('a.summary', 'like', searchTerm);
    });
    countQuery = countQuery.where(function() {
      this.where('a.title', 'like', searchTerm)
          .orWhere('a.summary', 'like', searchTerm);
    });
  }
  
  // Get total count
  const countResult = await countQuery.count('* as total').first();
  const total = countResult?.total as number || 0;
  
  // Get paginated articles
  const articles = await query
    .orderBy('a.published_at', 'desc')
    .limit(limit)
    .offset((page - 1) * limit);
  
  // Fetch tags for each article using Knex
  const articlesWithTags = await Promise.all(
    articles.map(async (article) => {
      const tags = await db('tags as t')
        .select('t.id', 't.name')
        .join('article_tags as at', 't.id', 'at.tag_id')
        .where('at.article_id', article.id);
      
      return {
        ...article,
        tags
      };
    })
  );
  
  const totalPages = Math.ceil(total / limit);
  
  return {
    data: articlesWithTags,
    total,
    page,
    limit,
    totalPages
  };
}

export async function toggleArticleReadStatus(id: number): Promise<boolean> {
  const db = getDb();
  
  // First get current status
  const currentArticle = await db('articles')
    .select('is_read')
    .where('id', id)
    .first();
  
  if (!currentArticle) {
    throw new Error('Article not found');
  }
  
  const newStatus = !currentArticle.is_read;
  await db('articles')
    .where('id', id)
    .update({ is_read: newStatus });
  
  return newStatus;
}

export async function toggleArticleSkipStatus(id: number): Promise<boolean> {
  const db = getDb();
  
  // First get current status
  const currentArticle = await db('articles')
    .select('is_skipped')
    .where('id', id)
    .first();
  
  if (!currentArticle) {
    throw new Error('Article not found');
  }
  
  const newStatus = !currentArticle.is_skipped;
  await db('articles')
    .where('id', id)
    .update({ is_skipped: newStatus });
  
  return newStatus;
}

export async function toggleArticleStarred(id: number): Promise<boolean> {
  const db = getDb();
  
  // First get current status
  const currentArticle = await db('articles')
    .select('starred')
    .where('id', id)
    .first();
  
  if (!currentArticle) {
    throw new Error('Article not found');
  }
  
  const newStatus = !currentArticle.starred;
  await db('articles')
    .where('id', id)
    .update({ starred: newStatus });
  
  return newStatus;
}

export async function rateArticle(id: number, rating: number | null): Promise<void> {
  const db = getDb();
  
  // Validate rating
  if (rating !== null && (rating < 0 || rating > 5)) {
    throw new Error('Rating must be between 0 and 5, or null');
  }
  
  const result = await db('articles')
    .where('id', id)
    .update({ rating });
  
  if (result === 0) {
    throw new Error('Article not found');
  }
}

export async function updateArticleNote(id: number, note: string | null): Promise<void> {
  const db = getDb();
  
  const result = await db('articles')
    .where('id', id)
    .update({ note });
  
  if (result === 0) {
    throw new Error('Article not found');
  }
}

export async function toggleArticleDeleted(id: number): Promise<boolean> {
  const db = getDb();
  
  // First get current status
  const currentArticle = await db('articles')
    .select('deleted')
    .where('id', id)
    .first();
  
  if (!currentArticle) {
    throw new Error('Article not found');
  }
  
  const newStatus = !currentArticle.deleted;
  await db('articles')
    .where('id', id)
    .update({ deleted: newStatus });
  
  return newStatus;
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

async function getOrCreateCategory(trx: Knex.Transaction, categoryName: string): Promise<number> {
  const existingCategory = await trx('categories')
    .select('id')
    .where('name', categoryName)
    .first();

  if (existingCategory) {
    return existingCategory.id;
  }

  const [newCategoryId] = await trx('categories').insert({ name: categoryName });
  return newCategoryId;
}

async function getOrCreateTag(trx: Knex.Transaction, tagName: string): Promise<number> {
  const existingTag = await trx('tags')
    .select('id')
    .where('name', tagName)
    .first();

  if (existingTag) {
    return existingTag.id;
  }

  const [newTagId] = await trx('tags').insert({ name: tagName });
  return newTagId;
}

async function updateArticleAssociations(
  trx: Knex.Transaction,
  articleId: number,
  categoryName?: string,
  tagNames?: string[]
) {
  // Update category association
  if (categoryName) {
    const categoryId = await getOrCreateCategory(trx, categoryName);

    await trx('article_categories')
      .where('article_id', articleId)
      .delete();

    await trx('article_categories').insert({
      article_id: articleId,
      category_id: categoryId
    });
  }

  // Update tag associations
  if (tagNames && tagNames.length > 0) {
    await trx('article_tags')
      .where('article_id', articleId)
      .delete();

    for (const tagName of tagNames) {
      const tagId = await getOrCreateTag(trx, tagName);
      await trx('article_tags').insert({
        article_id: articleId,
        tag_id: tagId
      });
    }
  }
}

export async function createArticle(data: CreateArticleData): Promise<{ success: boolean; id?: number; error?: string; updated?: boolean }> {
  const db = getDb();

  const existingArticle = await db('articles')
    .select('id')
    .where('original_url', data.original_url)
    .first();

  if (existingArticle) {
    // Update existing article
    await db.transaction(async (trx) => {
      await trx('articles')
        .where('id', existingArticle.id)
        .update({
          title: data.title,
          summary: data.summary,
          source_name: data.source_name,
          published_at: data.published_at,
        });

      await updateArticleAssociations(trx, existingArticle.id, data.category_name, data.tag_names);
    });

    return {
      success: true,
      id: existingArticle.id,
      updated: true
    };
  }

  // Create new article
  const result = await db.transaction(async (trx) => {
    const [articleId] = await trx('articles').insert({
      title: data.title,
      original_url: data.original_url,
      summary: data.summary,
      source_name: data.source_name,
      published_at: data.published_at,
      is_read: false,
      is_skipped: false,
      starred: false,
      deleted: false,
      rating: null,
      note: null
    });

    await updateArticleAssociations(trx, articleId, data.category_name, data.tag_names);

    return { articleId };
  });

  return { success: true, id: result.articleId, updated: false };
}

export async function checkArticleExists(url: string): Promise<boolean> {
  const db = getDb();
  const existingArticle = await db('articles')
    .select('id')
    .where('original_url', url)
    .first();
  
  return !!existingArticle;
}
