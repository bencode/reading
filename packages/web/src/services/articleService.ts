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
  // tags: string | null; // Removed as per new schema
}

export interface Category {
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

export async function getArticles(categoryId?: number, page: number = 1, limit: number = 12): Promise<PaginatedResponse<Article>> {
  const db = getDb();
  
  // Count query
  let countQuery = 'SELECT COUNT(*) as total FROM articles a';
  const countParams: any[] = [];
  
  if (categoryId) {
    countQuery += ' JOIN article_categories ac ON a.id = ac.article_id WHERE ac.category_id = ?';
    countParams.push(categoryId);
  }
  
  const countStmt = db.prepare(countQuery);
  const countResult = countStmt.get(...countParams) as { total: number };
  const total = countResult.total;
  
  // Data query with pagination
  let query = 'SELECT a.* FROM articles a';
  const params: any[] = [];

  if (categoryId) {
    query += ' JOIN article_categories ac ON a.id = ac.article_id WHERE ac.category_id = ?';
    params.push(categoryId);
  }

  query += ' ORDER BY a.published_at DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const stmt = db.prepare(query);
  const articles = stmt.all(...params) as Article[];
  
  const totalPages = Math.ceil(total / limit);
  
  return {
    data: articles,
    total,
    page,
    limit,
    totalPages
  };
}

export async function markArticleAsRead(id: number): Promise<void> {
  const db = getDb();
  const stmt = db.prepare('UPDATE articles SET is_read = TRUE WHERE id = ?');
  stmt.run(id);
}
