import { getDb } from '../../lib/db';

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
