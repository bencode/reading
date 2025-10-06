import { NextRequest, NextResponse } from 'next/server';
import { getArticles, type ArticleFilters, createArticle, type CreateArticleData } from '../../../services/articleService';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get('categoryId');
  const starred = searchParams.get('starred');
  const read = searchParams.get('read');
  const deleted = searchParams.get('deleted');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  
  const filters: ArticleFilters = {};
  
  if (categoryId) {
    filters.categoryId = parseInt(categoryId);
  }
  
  if (starred !== null) {
    filters.starred = starred === 'true';
  }
  
  if (read !== null) {
    filters.read = read === 'true';
  }
  
  if (deleted !== null) {
    filters.deleted = deleted === 'true';
  }
  
  if (search) {
    filters.search = search;
  }
  
  const result = await getArticles(filters, page, limit);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const data: CreateArticleData = await request.json()

  if (!data.title || !data.original_url || !data.summary || !data.source_name) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  const result = await createArticle(data)

  if (result.success) {
    return NextResponse.json(
      {
        success: true,
        id: result.id,
        updated: result.updated,
        message: result.updated ? 'Article updated successfully' : 'Article created successfully'
      },
      { status: result.updated ? 200 : 201 }
    )
  } else {
    return NextResponse.json(
      { error: result.error, id: result.id },
      { status: 409 }
    )
  }
}
