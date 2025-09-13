import { NextRequest, NextResponse } from 'next/server';
import { getIssue, updateIssue, deleteIssue, createIssueSection, deleteIssueSection } from '@/services/issueService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseInt(idParam);
  
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const issue = await getIssue(id);
  
  if (!issue) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
  }
  
  return NextResponse.json(issue);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseInt(idParam);
  
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const { sections, ...updates } = await request.json();
  
  // Update issue basic info
  const issue = await updateIssue(id, updates);
  
  if (!issue) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
  }

  // Update sections if provided
  if (sections && Array.isArray(sections)) {
    // Delete all existing sections first
    const currentIssue = await getIssue(id);
    if (currentIssue?.sections) {
      for (const section of currentIssue.sections) {
        await deleteIssueSection(section.id);
      }
    }
    
    // Create new sections
    for (let i = 0; i < sections.length; i++) {
      const sectionData = sections[i];
      await createIssueSection(id, {
        article_id: sectionData.article_id,
        title: sectionData.title,
        description: sectionData.description,
        image: sectionData.image,
        external_url: sectionData.external_url,
        order_index: i
      });
    }
    
    // Refetch issue with sections
    const updatedIssue = await getIssue(id);
    return NextResponse.json(updatedIssue);
  }
  
  return NextResponse.json(issue);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseInt(idParam);
  
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  await deleteIssue(id);
  
  return NextResponse.json({ success: true });
}