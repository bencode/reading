import { NextRequest, NextResponse } from 'next/server';
import { checkArticleExists } from '../../../../services/articleService';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }
  
  const exists = await checkArticleExists(url);
  return NextResponse.json({ exists });
}