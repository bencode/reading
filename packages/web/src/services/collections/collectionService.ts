import { getDb } from '../../lib/db';
import type {
  Collection,
  CreateCollectionData,
  UpdateCollectionData,
  PaginatedResponse
} from './types';
import { getCollectionSections } from './collectionSectionService';

// Collections CRUD operations
export async function createCollection(data: CreateCollectionData): Promise<Collection> {
  const db = getDb();

  const [collectionId] = await db('collections').insert({
    title: data.title,
    description: data.description || null,
    cover_image: data.cover_image || null,
    status: data.status || 'draft'
  });

  const result = await getCollection(collectionId);
  if (!result) {
    throw new Error('Failed to create collection');
  }
  return result;
}

export async function getCollection(id: number): Promise<Collection | null> {
  const db = getDb();

  const collection = await db('collections')
    .select('*')
    .where('id', id)
    .first() as Collection | undefined;

  if (!collection) return null;

  // Get sections with articles and tags
  const sections = await getCollectionSections(id);

  return {
    ...collection,
    sections
  };
}

export async function getCollections(options: {
  status?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<PaginatedResponse<Collection>> {
  const db = getDb();
  const { status, limit = 20, offset = 0 } = options;

  let query = db('collections').select('*');
  let countQuery = db('collections');

  if (status) {
    query = query.where('status', status);
    countQuery = countQuery.where('status', status);
  }

  const countResult = await countQuery.count('* as total').first();
  const total = countResult?.total as number || 0;

  const collections = await query
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset) as Collection[];

  // Get sections count for each collection
  const collectionsWithSectionCounts = await Promise.all(
    collections.map(async (collection) => {
      const sectionCount = await db('collection_sections')
        .where('collection_id', collection.id)
        .count('* as count')
        .first();

      return {
        ...collection,
        sections: Array(sectionCount?.count as number || 0).fill(null)
      };
    })
  );

  const totalPages = Math.ceil(total / limit);
  const page = Math.floor(offset / limit) + 1;

  return {
    data: collectionsWithSectionCounts,
    total,
    page,
    limit,
    totalPages
  };
}

export async function updateCollection(id: number, updates: UpdateCollectionData): Promise<Collection | null> {
  const db = getDb();

  const updated = await db('collections')
    .where('id', id)
    .update({
      ...updates,
      updated_at: db.fn.now()
    });

  if (updated === 0) return null;

  return await getCollection(id);
}

export async function deleteCollection(id: number): Promise<void> {
  const db = getDb();

  await db.transaction(async (trx) => {
    // Get all section IDs for this collection
    const sections = await trx('collection_sections')
      .select('id')
      .where('collection_id', id);

    // Delete section tags for all sections in this collection
    for (const section of sections) {
      await trx('collection_section_tags')
        .where('collection_section_id', section.id)
        .del();
    }

    // Delete sections
    await trx('collection_sections').where('collection_id', id).del();
    // Delete collection
    await trx('collections').where('id', id).del();
  });
}