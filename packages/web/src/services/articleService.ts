// Re-export all from article module for backward compatibility
export type {
  Article,
  Category,
  ArticleFilters,
  CreateArticleData,
  Tag,
  PaginatedResponse
} from './article/types';

export {
  getCategories,
  getArticles,
  checkArticleExists,
  createArticle,
  toggleArticleReadStatus,
  toggleArticleSkipStatus,
  toggleArticleStarred,
  rateArticle,
  updateArticleNote,
  toggleArticleDeleted
} from './article';
