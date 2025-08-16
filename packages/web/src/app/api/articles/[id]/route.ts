import { NextRequest, NextResponse } from 'next/server';
import { toggleArticleReadStatus, toggleArticleStarred, rateArticle, toggleArticleDeleted } from '../../../../services/articleService';
import { withAuth } from '../../../../lib/middleware';

const actionHandlers = {
  toggle_read: async (articleId: number) => ({
    is_read: await toggleArticleReadStatus(articleId)
  }),
  toggle_starred: async (articleId: number) => ({
    starred: await toggleArticleStarred(articleId)
  }),
  rate: async (articleId: number, rating: number) => {
    await rateArticle(articleId, rating);
    return { rating };
  },
  toggle_deleted: async (articleId: number) => ({
    deleted: await toggleArticleDeleted(articleId)
  })
};

export const PATCH = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const articleId = parseInt(id);
  
  if (isNaN(articleId)) {
    return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
  }

  const body = await request.json();
  const { action, rating } = body;

  const handler = actionHandlers[action as keyof typeof actionHandlers] || actionHandlers.toggle_read;
  const result = await handler(articleId, rating);
  
  return NextResponse.json({ success: true, ...result });
});