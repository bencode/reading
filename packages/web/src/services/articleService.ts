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
  tags: string | null;
}

export async function getArticles(): Promise<Article[]> {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM articles ORDER BY published_at DESC');
  const articles = stmt.all() as Article[];
  return articles;
}

export async function markArticleAsRead(id: number): Promise<void> {
  const db = getDb();
  const stmt = db.prepare('UPDATE articles SET is_read = TRUE WHERE id = ?');
  stmt.run(id);
}
