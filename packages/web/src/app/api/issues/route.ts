import { NextRequest, NextResponse } from 'next/server';
import { getIssues, createIssue, createIssueSection, getIssue } from '@/services/issueService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const limit = parseInt(searchParams.get('limit') || '20');
  const page = parseInt(searchParams.get('page') || '1');
  const offset = (page - 1) * limit;

  const result = await getIssues({ status, limit, offset });
  
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const { title, description, cover_image, status, sections } = body;
  
  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  // Create issue
  const issue = await createIssue({
    title: title.trim(),
    description,
    cover_image,
    status: status || 'draft'
  });

  // Create sections if provided
  if (sections && Array.isArray(sections)) {
    for (let i = 0; i < sections.length; i++) {
      const sectionData = sections[i];
      await createIssueSection(issue.id, {
        article_id: sectionData.article_id,
        title: sectionData.title,
        description: sectionData.description,
        image: sectionData.image,
        external_url: sectionData.external_url,
        order_index: i
      });
    }
    
    // Refetch issue with sections
    const issueWithSections = await getIssue(issue.id);
    return NextResponse.json(issueWithSections, { status: 201 });
  }

  return NextResponse.json(issue, { status: 201 });
}