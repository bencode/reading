import { NextRequest, NextResponse } from 'next/server';
import { toggleArticleReadStatus, toggleArticleStarred, rateArticle, toggleArticleDeleted } from '../../../../services/articleService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const articleId = parseInt(id);
    
    if (isNaN(articleId)) {
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    const body = await request.json();
    const { action, rating } = body;

    const result: Record<string, unknown> = { success: true };

    switch (action) {
      case 'toggle_read':
        const newReadStatus = await toggleArticleReadStatus(articleId);
        result.is_read = newReadStatus;
        break;
        
      case 'toggle_starred':
        const newStarredStatus = await toggleArticleStarred(articleId);
        result.starred = newStarredStatus;
        break;
        
      case 'rate':
        await rateArticle(articleId, rating);
        result.rating = rating;
        break;
        
      case 'toggle_deleted':
        const newDeletedStatus = await toggleArticleDeleted(articleId);
        result.deleted = newDeletedStatus;
        break;
        
      default:
        // Default to toggle read for backward compatibility
        const defaultNewStatus = await toggleArticleReadStatus(articleId);
        result.is_read = defaultNewStatus;
        break;
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating article:', error);
    
    if (error instanceof Error && error.message === 'Article not found') {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    
    if (error instanceof Error && error.message.includes('Rating must be')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Failed to update article' }, 
      { status: 500 }
    );
  }
}