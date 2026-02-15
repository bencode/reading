import type { Knex } from 'knex';
import { getDb } from '../../lib/db';
import type { CreateArticleData } from './types';

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
      is_read: 0,
      is_skipped: 0,
      starred: 0,
      deleted: 0,
      rating: null,
      note: null
    });

    await updateArticleAssociations(trx, articleId, data.category_name, data.tag_names);

    return { articleId };
  });

  return { success: true, id: result.articleId, updated: false };
}
