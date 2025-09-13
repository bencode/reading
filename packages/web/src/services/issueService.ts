import { getDb } from '../lib/db';
import { Article } from './articleService';

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type Issue = {
  id: number;
  title: string;
  description: string | null;
  cover_image: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  published_at: string | null;
  updated_at: string;
  sections?: IssueSection[];
}

export type IssueSection = {
  id: number;
  issue_id: number;
  article_id: number;
  title: string | null;
  description: string | null;
  image: string | null;
  external_url: string | null;
  order_index: number;
  created_at: string;
  article?: Article;
}

export type CreateIssueData = {
  title: string;
  description?: string;
  cover_image?: string;
  status?: 'draft' | 'published';
}

export type CreateIssueSectionData = {
  article_id: number;
  title?: string;
  description?: string;
  image?: string;
  external_url?: string;
  order_index?: number;
}

export type UpdateIssueData = {
  title?: string;
  description?: string;
  cover_image?: string;
  status?: 'draft' | 'published' | 'archived';
}

export type UpdateIssueSectionData = {
  title?: string;
  description?: string;
  image?: string;
  external_url?: string;
  order_index?: number;
}

// Issues CRUD operations
export async function createIssue(data: CreateIssueData): Promise<Issue> {
  const db = getDb();
  
  const [issueId] = await db('issues').insert({
    title: data.title,
    description: data.description || null,
    cover_image: data.cover_image || null,
    status: data.status || 'draft'
  });
  
  return await getIssue(issueId);
}

export async function getIssue(id: number): Promise<Issue | null> {
  const db = getDb();
  
  const issue = await db('issues')
    .select('*')
    .where('id', id)
    .first() as Issue | undefined;
    
  if (!issue) return null;
  
  // Get sections with article data
  const sections = await db('issue_sections as s')
    .select(
      's.*',
      'a.title as article_title',
      'a.summary as article_summary',
      'a.original_url as article_url',
      'a.source_name as article_source',
      'a.published_at as article_published_at'
    )
    .leftJoin('articles as a', 's.article_id', 'a.id')
    .where('s.issue_id', id)
    .orderBy('s.order_index', 'asc');
    
  const sectionsWithArticles = sections.map(section => ({
    id: section.id,
    issue_id: section.issue_id,
    article_id: section.article_id,
    title: section.title,
    description: section.description,
    image: section.image,
    external_url: section.external_url,
    order_index: section.order_index,
    created_at: section.created_at,
    article: section.article_title ? {
      id: section.article_id,
      title: section.article_title,
      summary: section.article_summary,
      original_url: section.article_url,
      source_name: section.article_source,
      published_at: section.article_published_at
    } : undefined
  }));
  
  return {
    ...issue,
    sections: sectionsWithArticles
  };
}

export async function getIssues(options: {
  status?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<PaginatedResponse<Issue>> {
  const db = getDb();
  const { status, limit = 20, offset = 0 } = options;
  
  let query = db('issues').select('*');
  let countQuery = db('issues');
  
  if (status) {
    query = query.where('status', status);
    countQuery = countQuery.where('status', status);
  }
  
  const countResult = await countQuery.count('* as total').first();
  const total = countResult?.total as number || 0;
  
  const issues = await query
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset) as Issue[];
  
  const totalPages = Math.ceil(total / limit);
  const page = Math.floor(offset / limit) + 1;
  
  return {
    data: issues,
    total,
    page,
    limit,
    totalPages
  };
}

export async function updateIssue(id: number, updates: UpdateIssueData): Promise<Issue | null> {
  const db = getDb();
  
  const updated = await db('issues')
    .where('id', id)
    .update({
      ...updates,
      updated_at: db.fn.now()
    });
    
  if (updated === 0) return null;
  
  return await getIssue(id);
}

export async function deleteIssue(id: number): Promise<void> {
  const db = getDb();
  
  await db.transaction(async (trx) => {
    await trx('issue_sections').where('issue_id', id).del();
    await trx('issues').where('id', id).del();
  });
}

// Issue Sections CRUD operations
export async function createIssueSection(
  issueId: number, 
  data: CreateIssueSectionData
): Promise<IssueSection> {
  const db = getDb();
  
  let orderIndex = data.order_index;
  if (orderIndex === undefined) {
    const lastSection = await db('issue_sections')
      .where('issue_id', issueId)
      .orderBy('order_index', 'desc')
      .first();
    orderIndex = lastSection ? lastSection.order_index + 1 : 0;
  }
  
  const [sectionId] = await db('issue_sections').insert({
    issue_id: issueId,
    article_id: data.article_id,
    title: data.title || null,
    description: data.description || null,
    image: data.image || null,
    external_url: data.external_url || null,
    order_index: orderIndex
  });
  
  return await getIssueSection(sectionId);
}

export async function getIssueSection(id: number): Promise<IssueSection | null> {
  const db = getDb();
  
  const section = await db('issue_sections as s')
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
  
  return {
    id: section.id,
    issue_id: section.issue_id,
    article_id: section.article_id,
    title: section.title,
    description: section.description,
    image: section.image,
    external_url: section.external_url,
    order_index: section.order_index,
    created_at: section.created_at,
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

export async function updateIssueSection(
  id: number, 
  updates: UpdateIssueSectionData
): Promise<IssueSection | null> {
  const db = getDb();
  
  const updated = await db('issue_sections')
    .where('id', id)
    .update({
      ...updates,
      updated_at: db.fn.now()
    });
    
  if (updated === 0) return null;
  
  return await getIssueSection(id);
}

export async function deleteIssueSection(id: number): Promise<void> {
  const db = getDb();
  await db('issue_sections').where('id', id).del();
}