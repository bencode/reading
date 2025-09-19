import { getDb } from '../lib/db';
import { Article, Tag } from './articleService';

export type CollectionStatus = 'draft' | 'published' | 'archived';
export type CollectionFormStatus = 'draft' | 'published';

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type Collection = {
  id: number;
  title: string;
  description: string | null;
  cover_image: string | null;
  status: CollectionStatus;
  created_at: string;
  published_at: string | null;
  updated_at: string;
  sections?: CollectionSection[];
}

export type CollectionSection = {
  id: number;
  collection_id: number;
  article_id: number;
  title: string | null;
  description: string | null;
  image: string | null;
  external_url: string | null;
  order_index: number;
  created_at: string;
  tags: Tag[];
  tag_names?: string[]; // For form updates
  article?: Pick<Article, 'id' | 'title' | 'summary' | 'original_url' | 'source_name' | 'published_at'>;
}

export type CreateCollectionData = {
  title: string;
  description?: string;
  cover_image?: string;
  status?: CollectionFormStatus;
}

export type CreateCollectionSectionData = {
  article_id: number;
  title?: string;
  description?: string;
  image?: string;
  external_url?: string;
  order_index?: number;
  tag_names?: string[];
}

export type UpdateCollectionData = {
  title?: string;
  description?: string;
  cover_image?: string;
  status?: CollectionStatus;
}

export type UpdateCollectionSectionData = {
  title?: string;
  description?: string;
  image?: string;
  external_url?: string;
  order_index?: number;
  tag_names?: string[];
}

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
  
  // Get sections with article data
  const sections = await db('collection_sections as s')
    .select(
      's.*',
      'a.title as article_title',
      'a.summary as article_summary',
      'a.original_url as article_url',
      'a.source_name as article_source',
      'a.published_at as article_published_at'
    )
    .leftJoin('articles as a', 's.article_id', 'a.id')
    .where('s.collection_id', id)
    .orderBy('s.order_index', 'asc');
    
  // Fetch tags for each section
  const sectionsWithArticles = await Promise.all(
    sections.map(async (section) => {
      const tags = await db('tags as t')
        .select('t.id', 't.name')
        .join('collection_section_tags as cst', 't.id', 'cst.tag_id')
        .where('cst.collection_section_id', section.id);

      return {
        id: section.id,
        collection_id: section.collection_id,
        article_id: section.article_id,
        title: section.title,
        description: section.description,
        image: section.image,
        external_url: section.external_url,
        order_index: section.order_index,
        created_at: section.created_at,
        tags,
        tag_names: tags.map(tag => tag.name), // Initialize tag_names for form editing
        article: section.article_title ? {
          id: section.article_id,
          title: section.article_title,
          summary: section.article_summary,
          original_url: section.article_url,
          source_name: section.article_source,
          published_at: section.article_published_at
        } : undefined
      };
    })
  );
  
  return {
    ...collection,
    sections: sectionsWithArticles
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

// Collection Sections CRUD operations
export async function createCollectionSection(
  collectionId: number,
  data: CreateCollectionSectionData
): Promise<CollectionSection> {
  const db = getDb();

  return await db.transaction(async (trx) => {
    let orderIndex = data.order_index;
    if (orderIndex === undefined) {
      const lastSection = await trx('collection_sections')
        .where('collection_id', collectionId)
        .orderBy('order_index', 'desc')
        .first();
      orderIndex = lastSection ? lastSection.order_index + 1 : 0;
    }

    const [sectionId] = await trx('collection_sections').insert({
      collection_id: collectionId,
      article_id: data.article_id,
      title: data.title || null,
      description: data.description || null,
      image: data.image || null,
      external_url: data.external_url || null,
      order_index: orderIndex
    });

    // Handle tags - if provided, use them; otherwise copy from article
    let tagNames = data.tag_names;
    if (!tagNames) {
      // Get article's tags to copy as defaults
      const articleTags = await trx('tags as t')
        .select('t.name')
        .join('article_tags as at', 't.id', 'at.tag_id')
        .where('at.article_id', data.article_id);
      tagNames = articleTags.map(tag => tag.name);
    }

    // Add tags to section
    for (const tagName of tagNames) {
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

      await trx('collection_section_tags').insert({
        collection_section_id: sectionId,
        tag_id: tagId
      });
    }

    const result = await getCollectionSection(sectionId);
    return result!;
  });
}

export async function getCollectionSection(id: number): Promise<CollectionSection | null> {
  const db = getDb();
  
  const section = await db('collection_sections as s')
    .select(
      's.*',
      'a.title as article_title',
      'a.summary as article_summary',
      'a.original_url as article_url',
      'a.source_name as article_source',
      'a.published_at as article_published_at'
    )
    .leftJoin('articles as a', 's.article_id', 'a.id')
    .where('s.id', id)
    .first();
    
  if (!section) return null;

  // Get tags for this section
  const tags = await db('tags as t')
    .select('t.id', 't.name')
    .join('collection_section_tags as cst', 't.id', 'cst.tag_id')
    .where('cst.collection_section_id', id);

  return {
    id: section.id,
    collection_id: section.collection_id,
    article_id: section.article_id,
    title: section.title,
    description: section.description,
    image: section.image,
    external_url: section.external_url,
    order_index: section.order_index,
    created_at: section.created_at,
    tags,
    tag_names: tags.map(tag => tag.name), // Initialize tag_names for form editing
    article: section.article_title ? {
      id: section.article_id,
      title: section.article_title,
      summary: section.article_summary,
      original_url: section.article_url,
      source_name: section.article_source,
      published_at: section.article_published_at
    } : undefined
  };
}

export async function updateCollectionSection(
  id: number,
  updates: UpdateCollectionSectionData
): Promise<CollectionSection | null> {
  const db = getDb();

  return await db.transaction(async (trx) => {
    const { tag_names, ...sectionUpdates } = updates;

    // Update section fields
    if (Object.keys(sectionUpdates).length > 0) {
      const updated = await trx('collection_sections')
        .where('id', id)
        .update({
          ...sectionUpdates,
          updated_at: db.fn.now()
        });

      if (updated === 0) return null;
    }

    // Update tags if provided
    if (tag_names !== undefined) {
      // Remove existing tags
      await trx('collection_section_tags')
        .where('collection_section_id', id)
        .del();

      // Add new tags
      for (const tagName of tag_names) {
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

        await trx('collection_section_tags').insert({
          collection_section_id: id,
          tag_id: tagId
        });
      }
    }

    return await getCollectionSection(id);
  });
}

export async function deleteCollectionSection(id: number): Promise<void> {
  const db = getDb();

  await db.transaction(async (trx) => {
    // Delete section tags
    await trx('collection_section_tags').where('collection_section_id', id).del();
    // Delete section
    await trx('collection_sections').where('id', id).del();
  });
}