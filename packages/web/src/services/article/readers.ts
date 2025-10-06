import { getDb } from '../../lib/db';
import type { Article, Category, ArticleFilters, PaginatedResponse } from './types';

export async function getCategories(): Promise<Category[]> {
  const db = getDb();
  const categories = await db('categories')
    .select('id', 'name', 'priority')
    .orderBy('priority', 'asc')
    .orderBy('name', 'asc');
  return categories;
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

export async function checkArticleExists(url: string): Promise<boolean> {
  const db = getDb();
  const existingArticle = await db('articles')
    .select('id')
    .where('original_url', url)
    .first();

  return !!existingArticle;
}
