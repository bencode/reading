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
  const stmt = db.prepare('SELECT id, name FROM categories ORDER BY name ASC');
  const categories = stmt.all() as Category[];
  return categories;
}

export interface ArticleFilters {
  categoryId?: number;
  starred?: boolean;
  deleted?: boolean;
  search?: string;
}

export async function getArticles(
  filters: ArticleFilters = {}, 
  page: number = 1, 
  limit: number = 12
): Promise<PaginatedResponse<Article>> {
  const db = getDb();
  
  // Build WHERE conditions
  const whereConditions: string[] = [];
  const countParams: any[] = [];
  const queryParams: any[] = [];
  
  // Default: exclude deleted articles unless explicitly requested
  if (filters.deleted === true) {
    whereConditions.push('a.deleted = 1');
  } else if (filters.deleted !== false) {
    whereConditions.push('a.deleted = 0');
  }
  
  // Filter by starred status
  if (filters.starred === true) {
    whereConditions.push('a.starred = 1');
  } else if (filters.starred === false) {
    whereConditions.push('a.starred = 0');
  }
  
  // Filter by search term
  if (filters.search) {
    whereConditions.push('(a.title LIKE ? OR a.summary LIKE ?)');
    const searchTerm = `%${filters.search}%`;
    countParams.push(searchTerm, searchTerm);
    queryParams.push(searchTerm, searchTerm);
  }
  
  // Build count query
  let countQuery = 'SELECT COUNT(*) as total FROM articles a';
  let hasCategory = false;
  
  if (filters.categoryId) {
    countQuery += ' JOIN article_categories ac ON a.id = ac.article_id';
    whereConditions.push('ac.category_id = ?');
    countParams.push(filters.categoryId);
    hasCategory = true;
  }
  
  if (whereConditions.length > 0) {
    countQuery += ' WHERE ' + whereConditions.join(' AND ');
  }
  
  const countStmt = db.prepare(countQuery);
  const countResult = countStmt.get(...countParams) as { total: number };
  const total = countResult.total;
  
  // Build data query
  let query = 'SELECT a.* FROM articles a';
  
  if (hasCategory) {
    query += ' JOIN article_categories ac ON a.id = ac.article_id';
  }
  
  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }
  
  query += ' ORDER BY a.published_at DESC LIMIT ? OFFSET ?';
  
  // Copy search params to query params
  queryParams.unshift(...countParams);
  queryParams.push(limit, (page - 1) * limit);
  
  const stmt = db.prepare(query);
  const articles = stmt.all(...queryParams) as Article[];
  
  // Fetch tags for each article
  const tagStmt = db.prepare(`
    SELECT t.id, t.name 
    FROM tags t 
    JOIN article_tags at ON t.id = at.tag_id 
    WHERE at.article_id = ?
  `);
  
  const articlesWithTags = articles.map(article => ({
    ...article,
    tags: tagStmt.all(article.id) as Tag[]
  }));
  
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
  const getCurrentStmt = db.prepare('SELECT is_read FROM articles WHERE id = ?');
  const currentArticle = getCurrentStmt.get(id) as { is_read: number } | undefined;
  
  if (!currentArticle) {
    throw new Error('Article not found');
  }
  
  const newStatus = !currentArticle.is_read;
  const updateStmt = db.prepare('UPDATE articles SET is_read = ? WHERE id = ?');
  updateStmt.run(newStatus ? 1 : 0, id);
  
  return newStatus;
}

export async function toggleArticleStarred(id: number): Promise<boolean> {
  const db = getDb();
  
  // First get current status
  const getCurrentStmt = db.prepare('SELECT starred FROM articles WHERE id = ?');
  const currentArticle = getCurrentStmt.get(id) as { starred: number } | undefined;
  
  if (!currentArticle) {
    throw new Error('Article not found');
  }
  
  const newStatus = !currentArticle.starred;
  const updateStmt = db.prepare('UPDATE articles SET starred = ? WHERE id = ?');
  updateStmt.run(newStatus ? 1 : 0, id);
  
  return newStatus;
}

export async function rateArticle(id: number, rating: number | null): Promise<void> {
  const db = getDb();
  
  // Validate rating
  if (rating !== null && (rating < 0 || rating > 5)) {
    throw new Error('Rating must be between 0 and 5, or null');
  }
  
  const updateStmt = db.prepare('UPDATE articles SET rating = ? WHERE id = ?');
  const result = updateStmt.run(rating, id);
  
  if (result.changes === 0) {
    throw new Error('Article not found');
  }
}

export async function toggleArticleDeleted(id: number): Promise<boolean> {
  const db = getDb();
  
  // First get current status
  const getCurrentStmt = db.prepare('SELECT deleted FROM articles WHERE id = ?');
  const currentArticle = getCurrentStmt.get(id) as { deleted: number } | undefined;
  
  if (!currentArticle) {
    throw new Error('Article not found');
  }
  
  const newStatus = !currentArticle.deleted;
  const updateStmt = db.prepare('UPDATE articles SET deleted = ? WHERE id = ?');
  updateStmt.run(newStatus ? 1 : 0, id);
  
  return newStatus;
}
