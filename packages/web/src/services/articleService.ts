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
