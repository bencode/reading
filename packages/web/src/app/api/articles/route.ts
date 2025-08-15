import { NextRequest, NextResponse } from 'next/server';
import { getArticles, ArticleFilters } from '../../../services/articleService';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get('categoryId');
  const starred = searchParams.get('starred');
  const deleted = searchParams.get('deleted');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  
  try {
    const filters: ArticleFilters = {};
    
    if (categoryId) {
      filters.categoryId = parseInt(categoryId);
    }
    
    if (starred !== null) {
      filters.starred = starred === 'true';
    }
    
    if (deleted !== null) {
      filters.deleted = deleted === 'true';
    }
    
    if (search) {
      filters.search = search;
    }
    
    const result = await getArticles(filters, page, limit);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}