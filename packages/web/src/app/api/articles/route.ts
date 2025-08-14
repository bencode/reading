import { NextRequest, NextResponse } from 'next/server';
import { getArticles } from '../../../services/articleService';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get('categoryId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  
  try {
    const result = await getArticles(
      categoryId ? parseInt(categoryId) : undefined, 
      page, 
      limit
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}