import { NextRequest, NextResponse } from 'next/server';
import { toggleArticleReadStatus } from '../../../../services/articleService';

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
    
    const newStatus = await toggleArticleReadStatus(articleId);
    
    return NextResponse.json({ 
      success: true, 
      is_read: newStatus 
    });
  } catch (error) {
    console.error('Error toggling article read status:', error);
    
    if (error instanceof Error && error.message === 'Article not found') {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to update article status' }, 
      { status: 500 }
    );
  }
}