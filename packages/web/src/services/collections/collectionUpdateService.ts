import { getDb } from '../../lib/db';
import type { CollectionSection, CreateCollectionSectionData } from './types';
import {
  createCollectionSection,
  updateCollectionSection,
  deleteCollectionSection,
  getCollectionSection
} from './collectionSectionService';
import { updateCollectionSectionTags } from './collectionTagService';

export type SectionUpdateData = CreateCollectionSectionData & {
  id?: number; // Include id for existing sections
}

/**
 * Intelligently updates collection sections with minimal database operations
 * Only performs necessary creates, updates, and deletes
 */
export async function updateCollectionSections(
  collectionId: number,
  newSections: SectionUpdateData[]
): Promise<CollectionSection[]> {
  const db = getDb();

  return await db.transaction(async (trx) => {
    // Get current sections
    const currentSections = await trx('collection_sections')
      .select('*')
      .where('collection_id', collectionId)
      .orderBy('order_index', 'asc');

    // Separate sections into different operations
    const operations = categorizeSectionOperations(currentSections, newSections);

    // Execute operations in sequence

    // 1. Delete removed sections
    for (const sectionId of operations.toDelete) {
      await deleteCollectionSection(sectionId);
    }

    // 2. Update existing sections
    for (const section of operations.toUpdate) {
      const { id, ...updateData } = section;
      await updateCollectionSection(id!, updateData);
    }

    // 3. Create new sections
    for (const section of operations.toCreate) {
      await createCollectionSection(collectionId, section);
    }

    // Return updated sections
    const updatedSections = await trx('collection_sections')
      .select('*')
      .where('collection_id', collectionId)
      .orderBy('order_index', 'asc');

    // Load full section data with articles and tags
    const sectionsWithDetails = await Promise.all(
      updatedSections.map(section => getCollectionSection(section.id))
    );

    return sectionsWithDetails.filter(section => section !== null) as CollectionSection[];
  });
}

/**
 * Categorizes sections into create, update, and delete operations
 */
function categorizeSectionOperations(
  currentSections: Array<{ id: number }>,
  newSections: SectionUpdateData[]
) {
  const currentSectionIds = new Set(currentSections.map(s => s.id));
  const newSectionIds = new Set(newSections.filter(s => s.id).map(s => s.id!));

  // Sections to delete: exist in current but not in new
  const toDelete = currentSections
    .filter(section => !newSectionIds.has(section.id))
    .map(section => section.id);

  // Sections to create: no id or id not in current
  const toCreate = newSections.filter(section => !section.id || !currentSectionIds.has(section.id));

  // Sections to update: have id and exist in current
  const toUpdate = newSections.filter(section => section.id && currentSectionIds.has(section.id));

  return { toDelete, toCreate, toUpdate };
}

/**
 * Intelligently updates only the tags that have changed for a section
 */
export async function updateSectionTagsIfChanged(
  sectionId: number,
  newTagNames: string[],
  currentTagNames: string[]
): Promise<boolean> {
  // Compare tag arrays
  const tagsChanged = !areTagArraysEqual(currentTagNames, newTagNames);

  if (tagsChanged) {
    await updateCollectionSectionTags(sectionId, newTagNames);
    return true; // Tags were updated
  }

  return false; // No changes needed
}

/**
 * Compare two tag arrays to see if they're equal
 */
function areTagArraysEqual(arr1: string[], arr2: string[]): boolean {
  if (arr1.length !== arr2.length) return false;

  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();

  return sorted1.every((tag, index) => tag === sorted2[index]);
}

/**
 * Checks if section data has changed (excluding tags)
 */
export function hasSectionDataChanged(
  current: Record<string, unknown>,
  updated: SectionUpdateData
): boolean {
  const fieldsToCompare = ['article_id', 'title', 'description', 'image', 'external_url', 'order_index'];

  return fieldsToCompare.some(field => {
    const currentValue = current[field];
    const updatedValue = updated[field as keyof SectionUpdateData];
    return currentValue !== updatedValue;
  });
}