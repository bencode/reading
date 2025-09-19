import { getDb } from '../../lib/db';
import type { Tag } from '../types';
import type { Knex } from 'knex';

// Collection Section Tag operations
export async function getCollectionSectionTags(sectionId: number): Promise<Tag[]> {
  const db = getDb();

  const tags = await db('tags as t')
    .select('t.id', 't.name')
    .join('collection_section_tags as cst', 't.id', 'cst.tag_id')
    .where('cst.collection_section_id', sectionId);

  return tags;
}

export async function updateCollectionSectionTags(
  sectionId: number,
  tagNames: string[],
  trx?: Knex.Transaction
): Promise<void> {
  const db = trx || getDb();

  const executeOperation = async (transaction: Knex.Transaction) => {
    // Remove existing tags
    await transaction('collection_section_tags')
      .where('collection_section_id', sectionId)
      .del();

    // Add new tags
    for (const tagName of tagNames) {
      let tagId: number;

      const existingTag = await transaction('tags')
        .select('id')
        .where('name', tagName)
        .first();

      if (existingTag) {
        tagId = existingTag.id;
      } else {
        const [newTagId] = await transaction('tags').insert({
          name: tagName
        });
        tagId = newTagId;
      }

      await transaction('collection_section_tags').insert({
        collection_section_id: sectionId,
        tag_id: tagId
      });
    }
  };

  if (trx) {
    await executeOperation(trx);
  } else {
    await db.transaction(executeOperation);
  }
}

export async function deleteCollectionSectionTags(sectionId: number): Promise<void> {
  const db = getDb();

  await db('collection_section_tags')
    .where('collection_section_id', sectionId)
    .del();
}

// Helper function to get or create tags
export async function getOrCreateTag(tagName: string, trx?: Knex.Transaction): Promise<number> {
  const db = trx || getDb();

  const existingTag = await db('tags')
    .select('id')
    .where('name', tagName)
    .first();

  if (existingTag) {
    return existingTag.id;
  }

  const [newTagId] = await db('tags').insert({
    name: tagName
  });

  return newTagId;
}