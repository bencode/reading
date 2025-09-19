// Export all types
export * from './types';

// Export collection operations
export {
  createCollection,
  getCollection,
  getCollections,
  updateCollection,
  deleteCollection
} from './collectionService';

// Export section operations
export {
  createCollectionSection,
  getCollectionSection,
  getCollectionSections,
  updateCollectionSection,
  deleteCollectionSection
} from './collectionSectionService';

// Export tag operations
export {
  getCollectionSectionTags,
  updateCollectionSectionTags,
  deleteCollectionSectionTags,
  getOrCreateTag
} from './collectionTagService';

// Export intelligent update operations
export {
  updateCollectionSections,
  updateSectionTagsIfChanged,
  hasSectionDataChanged
} from './collectionUpdateService';
export type { SectionUpdateData } from './collectionUpdateService';