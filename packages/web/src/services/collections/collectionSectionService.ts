import { getDb } from '../../lib/db';
import type {
  CollectionSection,
  CreateCollectionSectionData,
  UpdateCollectionSectionData
} from './types';
import { getCollectionSectionTags, updateCollectionSectionTags } from './collectionTagService';

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
    await updateCollectionSectionTags(sectionId, tagNames, trx);

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
  const tags = await getCollectionSectionTags(id);

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

export async function getCollectionSections(collectionId: number): Promise<CollectionSection[]> {
  const db = getDb();

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
    .where('s.collection_id', collectionId)
    .orderBy('s.order_index', 'asc');

  // Fetch tags for each section
  const sectionsWithArticles = await Promise.all(
    sections.map(async (section) => {
      const tags = await getCollectionSectionTags(section.id);

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

  return sectionsWithArticles;
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
      await updateCollectionSectionTags(id, tag_names, trx);
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