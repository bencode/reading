import { getDb } from '../lib/db';

export interface Article {
  id: number;
  title: string;
  original_url: string;
  summary: string;
  source_name: string;
  published_at: string;
  created_at: string;
  is_read: boolean;
  starred: boolean;
  rating: number | null;
  deleted: boolean;
  tags: Tag[];
}

export interface Category {
  id: number;
  name: string;
  priority?: number;
}

export interface Tag {
  id: number;
  name: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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

export async function createArticle(data: CreateArticleData): Promise<{ success: boolean; id?: number; error?: string }> {
  const db = getDb();
  
  // Check if article already exists
  const existingArticle = await db('articles')
    .select('id')
    .where('original_url', data.original_url)
    .first();
  
  if (existingArticle) {
    return { 
      success: false, 
      error: 'Article already exists', 
      id: existingArticle.id 
    };
  }

  const result = await db.transaction(async (trx) => {
    const [articleId] = await trx('articles').insert({
      title: data.title,
      original_url: data.original_url,
      summary: data.summary,
      source_name: data.source_name,
      published_at: data.published_at,
      is_read: false,
      starred: false,
      deleted: false,
      rating: null
    });

    if (data.category_name) {
      let categoryId: number;
      
      const existingCategory = await trx('categories')
        .select('id')
        .where('name', data.category_name)
        .first();
      
      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const [newCategoryId] = await trx('categories').insert({
          name: data.category_name
        });
        categoryId = newCategoryId;
      }
      
      await trx('article_categories').insert({
        article_id: articleId,
        category_id: categoryId
      });
    }

    if (data.tag_names && data.tag_names.length > 0) {
      for (const tagName of data.tag_names) {
        let tagId: number;
        
        const existingTag = await trx('tags')
          .select('id')
          .where('name', tagName)
          .first();
        
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          const [newTagId] = await trx('tags').insert({
            name: tagName
          });
          tagId = newTagId;
        }
        
        await trx('article_tags').insert({
          article_id: articleId,
          tag_id: tagId
        });
      }
    }

    return { articleId };
  });

  return { success: true, id: result.articleId };
}

export async function checkArticleExists(url: string): Promise<boolean> {
  const db = getDb();
  const existingArticle = await db('articles')
    .select('id')
    .where('original_url', url)
    .first();
  
  return !!existingArticle;
}
